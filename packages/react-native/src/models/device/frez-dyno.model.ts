import { Buffer } from "buffer"
import { FrezDyno as FrezDynoBase, type FrezDynoOptions } from "@hangtime/grip-connect"
import type { WriteCallback } from "@hangtime/grip-connect/src/interfaces/callback.interface.js"
import { BleManager, type Device as BleDevice, type Subscription } from "react-native-ble-plx"

/** Represents a Frez Dyno using React Native's native BLE transport. */
export class FrezDyno extends FrezDynoBase {
  manager: BleManager
  device?: BleDevice
  private notificationSubscription: Subscription | undefined

  constructor(options: FrezDynoOptions = {}) {
    super(options)
    this.manager = new BleManager()
  }

  override connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    await new Promise<void>((resolve, reject) => {
      let connecting = false
      let settled = false
      const stopScan = (): void => {
        try {
          this.manager.stopDeviceScan()
        } catch {
          // The scan may already have stopped after a native transport error.
        }
      }
      const fail = (error: Error): void => {
        if (settled) return
        settled = true
        stopScan()
        try {
          onError(error)
        } catch {
          // Preserve the transport error as the connect() rejection.
        }
        reject(error)
      }

      try {
        this.manager.startDeviceScan(null, { scanMode: 2, callbackType: 1 }, (error, scannedDevice) => {
          if (error) {
            fail(error)
            return
          }

          const name = scannedDevice?.localName ?? scannedDevice?.name
          if (!scannedDevice || !name?.startsWith("FrezDyno-") || connecting) return

          connecting = true
          this.device = scannedDevice
          stopScan()
          void scannedDevice
            .connect()
            .then(async (connectedDevice) => {
              this.device = await connectedDevice.requestMTU(85).catch(() => connectedDevice)
              console.log(`Connected to device: ${this.device.id}`)
              return this.onConnected(onSuccess)
            })
            .then(() => {
              if (settled) return
              settled = true
              resolve()
            })
            .catch((error: unknown) => fail(error instanceof Error ? error : new Error(String(error))))
        })
      } catch (error) {
        fail(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  override disconnect = async (): Promise<void> => {
    if (this.device) {
      await this.stop().catch(() => undefined)
      this.notificationSubscription?.remove()
      this.notificationSubscription = undefined
      await this.manager.cancelDeviceConnection(this.device.id)
    }
    this.onDisconnectCleanup()
  }

  override download = async (): Promise<void> => {
    throw new Error("Download is not supported on React Native")
  }

  protected override onConnected = async (onSuccess: () => void): Promise<void> => {
    this.updateTimestamp()

    if (!this.device) {
      throw new Error("Device is not available")
    }

    await this.device.discoverAllServicesAndCharacteristics()
    const transportService = this.services.find((service) => service.id === "frez-dyno")
    const notifyCharacteristic = transportService?.characteristics.find((characteristic) => characteristic.id === "rx")
    const writeCharacteristic = transportService?.characteristics.find((characteristic) => characteristic.id === "tx")
    if (!transportService || !notifyCharacteristic || !writeCharacteristic) {
      throw new Error("Frez Dyno transport configuration is incomplete.")
    }

    const discoveredServices = await this.device.services()
    const discoveredService = discoveredServices.find(
      (service) => service.uuid.toLowerCase() === transportService.uuid.toLowerCase(),
    )
    if (!discoveredService) throw new Error("Frez Dyno measurement service is unavailable.")

    const discoveredCharacteristics = await this.device.characteristicsForService(discoveredService.uuid)
    const hasNotify = discoveredCharacteristics.some(
      (characteristic) => characteristic.uuid.toLowerCase() === notifyCharacteristic.uuid.toLowerCase(),
    )
    const hasWrite = discoveredCharacteristics.some(
      (characteristic) => characteristic.uuid.toLowerCase() === writeCharacteristic.uuid.toLowerCase(),
    )
    if (!hasNotify || !hasWrite) {
      const firmware = await this.software().catch(() => undefined)
      throw new Error(
        `Frez Dyno protocol v1 characteristics are unavailable${firmware ? ` (firmware ${firmware})` : ""}.`,
      )
    }

    this.notificationSubscription = this.device.monitorCharacteristicForService(
      discoveredService.uuid,
      notifyCharacteristic.uuid,
      (error, characteristic) => {
        if (error) {
          console.error(error)
          return
        }
        if (!characteristic?.value) return

        const buffer = Buffer.from(characteristic.value, "base64")
        try {
          this.handleNotifications(new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength))
        } catch (notificationError) {
          console.error(notificationError)
          void this.disconnect()
        }
      },
    )

    onSuccess()
  }

  override read = async (serviceId: string, characteristicId: string, duration = 0): Promise<string | undefined> => {
    if (!this.device) return undefined

    const service = this.services.find((entry) => entry.id === serviceId)
    const characteristic = service?.characteristics.find((entry) => entry.id === characteristicId)
    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }

    this.updateTimestamp()
    const response = await this.device.readCharacteristicForService(service.uuid, characteristic.uuid)
    if (duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, duration))
    }
    if (!response.value) return undefined

    const value = Buffer.from(response.value, "base64")
    return serviceId === "battery" && characteristicId === "level"
      ? value[0]?.toString()
      : new TextDecoder("utf-8").decode(value)
  }

  override write = async (
    serviceId: string,
    characteristicId: string,
    message: string | Uint8Array | undefined,
    duration = 0,
    callback: WriteCallback = this.writeCallback,
  ): Promise<void> => {
    if (!this.device || message === undefined) return

    const service = this.services.find((entry) => entry.id === serviceId)
    const characteristic = service?.characteristics.find((entry) => entry.id === characteristicId)
    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }

    this.updateTimestamp()
    const value = typeof message === "string" ? new TextEncoder().encode(message) : message
    await this.device.writeCharacteristicWithResponseForService(
      service.uuid,
      characteristic.uuid,
      Buffer.from(value).toString("base64"),
    )

    this.writeLast = message
    this.writeCallback = callback
    if (duration > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, duration))
    }
  }

  protected override canReadDeviceSerial(): boolean {
    return this.device !== undefined
  }

  protected override getCoefficientDeviceName(): string | undefined {
    return (this.device?.localName ?? this.device?.name)?.trim() || undefined
  }
}
