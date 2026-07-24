import { Buffer } from "buffer"
import { FrezDyno as FrezDynoBase, type FrezDynoOptions } from "@hangtime/grip-connect"
import type { WriteCallback } from "@hangtime/grip-connect/src/interfaces/callback.interface.js"
import { BleManager, type Device as BleDevice, type Subscription } from "react-native-ble-plx"

const SCAN_TIMEOUT_MS = 10_000

/** Represents a Frez Dyno using React Native's native BLE transport. */
export class FrezDyno extends FrezDynoBase {
  manager: BleManager
  device?: BleDevice
  private cancelPendingConnection?: () => Promise<void>
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
      let scanTimeout: ReturnType<typeof setTimeout> | undefined
      const stopScan = (): void => {
        if (scanTimeout) {
          clearTimeout(scanTimeout)
          scanTimeout = undefined
        }
        try {
          this.manager.stopDeviceScan()
        } catch {
          // The scan may already have stopped after a native transport error.
        }
      }
      const fail = async (error: Error): Promise<void> => {
        if (settled) return
        settled = true
        stopScan()
        delete this.cancelPendingConnection
        await this.cleanupConnection().finally(() => {
          try {
            onError(error)
          } catch {
            // Preserve the transport error as the connect() rejection.
          }
          reject(error)
        })
      }
      this.cancelPendingConnection = () => {
        const error = new Error("Frez Dyno connection cancelled")
        error.name = "AbortError"
        return fail(error)
      }

      try {
        scanTimeout = setTimeout(() => void fail(new Error("No Frez Dyno found")), SCAN_TIMEOUT_MS)
        this.manager.startDeviceScan(null, { scanMode: 2, callbackType: 1 }, (error, scannedDevice) => {
          if (settled) return
          if (error) {
            void fail(error)
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
              if (settled) {
                await this.manager.cancelDeviceConnection(connectedDevice.id).catch(() => undefined)
                return
              }

              const mtuDevice = await connectedDevice.requestMTU(85).catch(() => connectedDevice)
              if (settled) {
                await this.manager.cancelDeviceConnection(mtuDevice.id).catch(() => undefined)
                return
              }

              this.device = mtuDevice
              console.log(`Connected to device: ${this.device.id}`)
              return this.onConnected(onSuccess)
            })
            .then(() => {
              if (settled) return
              settled = true
              delete this.cancelPendingConnection
              resolve()
            })
            .catch((error: unknown) => void fail(error instanceof Error ? error : new Error(String(error))))
        })
      } catch (error) {
        void fail(error instanceof Error ? error : new Error(String(error)))
      }
    })
  }

  override disconnect = async (): Promise<void> => {
    if (this.cancelPendingConnection) {
      await this.cancelPendingConnection()
      return
    }
    await this.cleanupConnection()
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
          void this.disconnect()
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

  private cleanupConnection = async (): Promise<void> => {
    try {
      this.manager.stopDeviceScan()
    } catch {
      // The scan may not be active.
    }

    const device = this.device
    try {
      this.notificationSubscription?.remove()
    } catch {
      // The subscription may already have ended after a transport error.
    }
    this.notificationSubscription = undefined

    try {
      if (device) {
        await this.stop().catch(() => undefined)
        await this.manager.cancelDeviceConnection(device.id).catch(() => undefined)
      }
    } finally {
      delete this.device
      this.onDisconnectCleanup()
    }
  }
}
