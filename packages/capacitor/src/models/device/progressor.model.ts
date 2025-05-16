import { BleClient, type BleDevice } from "@capacitor-community/bluetooth-le"
import { Filesystem, Directory } from "@capacitor/filesystem"
import { Progressor as ProgressorBase } from "@hangtime/grip-connect/src/index"
import type { WriteCallback } from "@hangtime/grip-connect/src/interfaces/callback.interface"

/**
 * Represents a Tindeq Progressor device.
 * {@link https://tindeq.com}
 */
export class Progressor extends ProgressorBase {
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
    // YYYY-MM-DD
    const date = now.toISOString().split("T")[0]
    // HH-MM-SS
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")

    const fileName = `data-export-${date}-${time}.${format}`

    try {
      await Filesystem.writeFile({
        path: fileName,
        data: content,
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
    // Get the characteristic from the service
    const service = this.services.find((service) => service.id === serviceId)
    const characteristic = service?.characteristics.find((char) => char.id === characteristicId)

    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }
    this.updateTimestamp()
    // Decode the value based on characteristicId and serviceId
    let decodedValue: string
    const decoder = new TextDecoder("utf-8")
    // Read the value from the characteristic
    const value = await BleClient.read(this.device.deviceId, service.uuid, characteristic.uuid)

    if (
      (serviceId === "battery" || serviceId === "humidity" || serviceId === "temperature") &&
      characteristicId === "level"
    ) {
      // This is battery-specific; return the first byte as the level
      decodedValue = value.getUint8(0).toString()
    } else {
      // Otherwise use a UTF-8 decoder
      decodedValue = decoder.decode(value)
    }
    // Wait for the specified duration before returning the result
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
    // Check if message is provided
    if (this.device === undefined || message === undefined) {
      return Promise.resolve()
    }
    // Get the characteristic from the service
    const service = this.services.find((service) => service.id === serviceId)
    const characteristic = service?.characteristics.find((char) => char.id === characteristicId)

    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }
    this.updateTimestamp()
    // Convert the message to Uint8Array if it's a string
    const valueToWrite = typeof message === "string" ? new TextEncoder().encode(message) : message
    // Write the value to the characteristic
    await BleClient.writeWithoutResponse(
      this.device.deviceId,
      service.uuid,
      characteristic.uuid,
      new DataView(valueToWrite.buffer),
    )
    // Update the last written message
    this.writeLast = message
    // Assign the provided callback to `writeCallback`
    this.writeCallback = callback
    // If a duration is specified, resolve the promise after the duration
    if (duration > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, duration))
    }
  }
}
