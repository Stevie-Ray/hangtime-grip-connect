import { BleClient, type BleDevice } from "@capacitor-community/bluetooth-le"
import { Directory, Filesystem } from "@capacitor/filesystem"
import { FrezDyno as FrezDynoBase, type FrezDynoOptions } from "@hangtime/grip-connect"
import type { WriteCallback } from "@hangtime/grip-connect/src/interfaces/callback.interface.js"

/** Represents a Frez Dyno using Capacitor's native BLE transport. */
export class FrezDyno extends FrezDynoBase {
  device?: BleDevice

  constructor(options: FrezDynoOptions = {}) {
    super(options)
  }

  override connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      await BleClient.initialize()

      const filterOptions = Object.assign({}, ...this.filters)
      this.device = await BleClient.requestDevice({
        ...filterOptions,
        optionalServices: this.getAllServiceUUIDs(),
      })

      await BleClient.connect(this.device.deviceId, (deviceId) => console.log(deviceId))
      const mtu = await BleClient.getMtu(this.device.deviceId)
      if (mtu < 85) throw new Error(`Frez Dyno requires MTU 85; the negotiated MTU is ${mtu}.`)
      await this.onConnected(onSuccess)
    } catch (error) {
      onError(error as Error)
    }
  }

  override disconnect = async (): Promise<void> => {
    if (this.device) {
      await this.stop().catch(() => undefined)
      const transportService = this.services.find((service) => service.id === "frez-dyno")
      const notifyCharacteristic = transportService?.characteristics.find(
        (characteristic) => characteristic.id === "rx",
      )
      if (transportService && notifyCharacteristic) {
        await BleClient.stopNotifications(this.device.deviceId, transportService.uuid, notifyCharacteristic.uuid).catch(
          () => undefined,
        )
      }
      await BleClient.disconnect(this.device.deviceId)
    }
    this.onDisconnectCleanup()
  }

  override download = async (format: "csv" | "json" | "xml" = "csv"): Promise<void> => {
    const content =
      format === "json" ? this.downloadToJSON() : format === "xml" ? this.downloadToXML() : this.downloadToCSV()
    const now = new Date()
    const date = now.toISOString().split("T")[0]
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")
    const fileName = `data-export-${date}-${time}.${format}`

    await Filesystem.writeFile({
      path: fileName,
      data: btoa(content),
      directory: Directory.Documents,
      recursive: true,
    })
    console.log(`File saved as ${fileName} in Documents directory`)
  }

  protected override onConnected = async (onSuccess: () => void): Promise<void> => {
    this.updateTimestamp()

    if (!this.device) {
      throw new Error("Device is not available")
    }

    const transportService = this.services.find((service) => service.id === "frez-dyno")
    const notifyCharacteristic = transportService?.characteristics.find((characteristic) => characteristic.id === "rx")
    const writeCharacteristic = transportService?.characteristics.find((characteristic) => characteristic.id === "tx")
    if (!transportService || !notifyCharacteristic || !writeCharacteristic) {
      throw new Error("Frez Dyno transport configuration is incomplete.")
    }

    const discoveredServices = await BleClient.getServices(this.device.deviceId)
    const discoveredService = discoveredServices.find(
      (service) => service.uuid.toLowerCase() === transportService.uuid.toLowerCase(),
    )
    if (!discoveredService) throw new Error("Frez Dyno measurement service is unavailable.")

    const hasNotify = discoveredService.characteristics.some(
      (characteristic) => characteristic.uuid.toLowerCase() === notifyCharacteristic.uuid.toLowerCase(),
    )
    const hasWrite = discoveredService.characteristics.some(
      (characteristic) => characteristic.uuid.toLowerCase() === writeCharacteristic.uuid.toLowerCase(),
    )
    if (!hasNotify || !hasWrite) {
      const firmware = await this.software().catch(() => undefined)
      throw new Error(
        `Frez Dyno protocol v1 characteristics are unavailable${firmware ? ` (firmware ${firmware})` : ""}.`,
      )
    }

    await BleClient.startNotifications(
      this.device.deviceId,
      discoveredService.uuid,
      notifyCharacteristic.uuid,
      (value) => {
        try {
          this.handleNotifications(value)
        } catch (error) {
          console.error(error)
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
    const value = await BleClient.read(this.device.deviceId, service.uuid, characteristic.uuid)
    const decodedValue =
      serviceId === "battery" && characteristicId === "level"
        ? value.getUint8(0).toString()
        : new TextDecoder("utf-8").decode(value)

    if (duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, duration))
    }

    return decodedValue
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
    const dataView = new DataView(value.buffer, value.byteOffset, value.byteLength)

    await BleClient.write(this.device.deviceId, service.uuid, characteristic.uuid, dataView)

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
    return this.device?.name?.trim() || undefined
  }
}
