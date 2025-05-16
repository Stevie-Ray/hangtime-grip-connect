import { BleManager, Device } from "react-native-ble-plx"
import { DocumentDirectoryPath, writeFile } from "@dr.pogodin/react-native-fs"
import { Motherboard as MotherboardBase } from "@hangtime/grip-connect/src/index"
import type { WriteCallback } from "@hangtime/grip-connect/src/interfaces/callback.interface"
import { Buffer } from "buffer"

/**
 * Represents a Griptonite Motherboard device.
 * {@link https://griptonite.io}
 */
export class Motherboard extends MotherboardBase {
  manager: BleManager
  device?: Device

  constructor() {
    super()
    this.manager = new BleManager()
  }

  override connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      const deviceServices = this.getAllServiceUUIDs()

      this.manager.startDeviceScan(deviceServices, { scanMode: 2, callbackType: 1 }, (error, scannedDevice) => {
        if (error) {
          onError(error)
          return
        }

        if (scannedDevice) {
          this.device = scannedDevice
          this.manager.stopDeviceScan()

          this.device
            .connect()
            .then((device) => {
              this.device = device
              console.log(`Connected to device: ${device.id}`)
              return this.onConnected(onSuccess)
            })
            .catch(onError)
        }
      })
    } catch (error) {
      onError(error as Error)
    }
  }

  override disconnect = async (): Promise<void> => {
    if (this.device) {
      await this.manager.cancelDeviceConnection(this.device.id)
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
    const filePath = `${DocumentDirectoryPath}/${fileName}`

    try {
      await writeFile(filePath, content, "utf8")
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

    await this.device.discoverAllServicesAndCharacteristics()
    const services = await this.device.services()

    for (const service of services) {
      const matchingService = this.services.find((boardService) => boardService.uuid === service.uuid)

      if (matchingService) {
        for (const characteristic of matchingService.characteristics) {
          if (characteristic.id === "rx") {
            this.device.monitorCharacteristicForService(service.uuid, characteristic.uuid, (error, characteristic) => {
              if (error) {
                console.error(error)
                return
              }
              if (characteristic?.value) {
                const buffer = Buffer.from(characteristic.value, "base64")
                const dataView = new DataView(buffer.buffer)
                this.handleNotifications(dataView)
              }
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
    // Read the value from the characteristic
    const response = await this.device.readCharacteristicForService(service.uuid, characteristic.uuid)

    // Wait for the specified duration before returning the result
    if (duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, duration))
    }

    return response.value ?? undefined
  }

  override write = async (
    serviceId: string,
    characteristicId: string,
    message: string | Uint8Array | undefined,
    duration = 0,
    callback: WriteCallback = this.writeCallback,
  ): Promise<void> => {
    // Check if message is provided
    if (!this.device || message === undefined) {
      return Promise.resolve()
    }
    // Get the characteristic from the service
    const service = this.services.find((service) => service.id === serviceId)
    const characteristic = service?.characteristics.find((char) => char.id === characteristicId)

    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }
    this.updateTimestamp()
    // Convert the message to string if it's a Uint8Array
    const valueToWrite = typeof message === "string" ? new TextEncoder().encode(message) : message
    const base64Value = Buffer.from(valueToWrite).toString("base64")
    // Write the value to the characteristic
    await this.device.writeCharacteristicWithResponseForService(service.uuid, characteristic.uuid, base64Value)
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
