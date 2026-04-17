import { BleClient, type BleDevice } from "@capacitor-community/bluetooth-le"
import { Directory, Filesystem } from "@capacitor/filesystem"
import { CTS500 as CTS500Base } from "@hangtime/grip-connect"
import type { WriteCallback } from "@hangtime/grip-connect/src/interfaces/callback.interface.js"

/**
 * Represents a Jlyscales CTS500 device.
 * {@link https://www.alibaba.com/product-detail/Mini-Climbing-Training-Scale-CTS500-Aluminum_1601637814595.html}
 */
export class CTS500 extends CTS500Base {
  device?: BleDevice

  override connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      const deviceServices = this.getAllServiceUUIDs()
      await BleClient.initialize()

      const filterOptions = Object.assign({}, ...this.filters)

      this.device = await BleClient.requestDevice({
        ...filterOptions,
        optionalServices: deviceServices,
      })

      await BleClient.connect(this.device.deviceId, (deviceId) => console.log(deviceId))

      await this.onConnected(onSuccess)
    } catch (error) {
      onError(error as Error)
    }
  }

  override disconnect = async (): Promise<void> => {
    if (this.device) {
      await BleClient.disconnect(this.device.deviceId)
    }
  }

  override download = async (format: "csv" | "json" | "xml" = "csv"): Promise<void> => {
    let content = ""

    if (format === "csv") {
      content = this.downloadToCSV()
    } else if (format === "json") {
      content = this.downloadToJSON()
    } else if (format === "xml") {
      content = this.downloadToXML()
    }

    const now = new Date()
    const date = now.toISOString().split("T")[0]
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")
    const fileName = `data-export-${date}-${time}.${format}`

    try {
      await Filesystem.writeFile({
        path: fileName,
        data: btoa(content),
        directory: Directory.Documents,
        recursive: true,
      })
      console.log(`File saved as ${fileName} in Documents directory`)
    } catch (error) {
      console.error("Error saving file:", error)
      throw error
    }
  }

  override onConnected = async (onSuccess: () => void): Promise<void> => {
    this.updateTimestamp()

    if (!this.device) {
      throw new Error("Device is not available")
    }

    const services = await BleClient.getServices(this.device.deviceId)

    for (const service of services) {
      const matchingService = this.services.find((boardService) => boardService.uuid === service.uuid)

      if (matchingService) {
        for (const characteristic of matchingService.characteristics) {
          if (characteristic.id === "rx") {
            await BleClient.startNotifications(this.device.deviceId, service.uuid, characteristic.uuid, (value) => {
              this.handleNotifications(value)
            })
          }
        }
      }
    }
    onSuccess()
  }

  override read = async (serviceId: string, characteristicId: string, duration = 0): Promise<string | undefined> => {
    if (this.device === undefined) {
      return undefined
    }

    const service = this.services.find((entry) => entry.id === serviceId)
    const characteristic = service?.characteristics.find((char) => char.id === characteristicId)

    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }

    this.updateTimestamp()
    const decoder = new TextDecoder("utf-8")
    const value = await BleClient.read(this.device.deviceId, service.uuid, characteristic.uuid)

    let decodedValue: string
    if (
      (serviceId === "battery" || serviceId === "humidity" || serviceId === "temperature") &&
      characteristicId === "level"
    ) {
      decodedValue = value.getUint8(0).toString()
    } else {
      decodedValue = decoder.decode(value)
    }

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
    if (this.device === undefined || message === undefined) {
      return Promise.resolve()
    }

    const service = this.services.find((entry) => entry.id === serviceId)
    const characteristic = service?.characteristics.find((char) => char.id === characteristicId)

    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }

    this.updateTimestamp()
    const valueToWrite = typeof message === "string" ? new TextEncoder().encode(message) : message

    await BleClient.writeWithoutResponse(
      this.device.deviceId,
      service.uuid,
      characteristic.uuid,
      new DataView(valueToWrite.buffer),
    )

    this.writeLast = message
    this.writeCallback = callback

    if (duration > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, duration))
    }
  }
}
