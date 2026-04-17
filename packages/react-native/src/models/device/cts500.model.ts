import { BleManager, Device } from "react-native-ble-plx"
import { CTS500 as CTS500Base } from "@hangtime/grip-connect"
import type { WriteCallback } from "@hangtime/grip-connect/src/interfaces/callback.interface.js"
import { Buffer } from "buffer"

/**
 * Represents a Jlyscales CTS500 device.
 * {@link https://www.alibaba.com/product-detail/Mini-Climbing-Training-Scale-CTS500-Aluminum_1601637814595.html}
 */
export class CTS500 extends CTS500Base {
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
      this.manager.startDeviceScan(null, { scanMode: 2, callbackType: 1 }, (error, scannedDevice) => {
        if (error) {
          onError(error)
          return
        }

        if (scannedDevice && this.filters.some((filter) => filter.name === scannedDevice.name)) {
          this.device = scannedDevice
          this.manager.stopDeviceScan()

          this.device
            .connect()
            .then((connectedDevice) => {
              this.device = connectedDevice
              console.log(`Connected to device: ${connectedDevice.id}`)
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

  override download = async (): Promise<void> => {
    throw new Error("Download is not supported on React Native")
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
            this.device.monitorCharacteristicForService(service.uuid, characteristic.uuid, (error, monitored) => {
              if (error) {
                console.error(error)
                return
              }
              if (monitored?.value) {
                const buffer = Buffer.from(monitored.value, "base64")
                const dataView = new DataView(buffer.buffer, buffer.byteOffset, buffer.byteLength)
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

    const service = this.services.find((entry) => entry.id === serviceId)
    const characteristic = service?.characteristics.find((char) => char.id === characteristicId)

    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }

    this.updateTimestamp()
    const response = await this.device.readCharacteristicForService(service.uuid, characteristic.uuid)

    if (duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, duration))
    }

    if (!response.value) {
      return undefined
    }

    const buffer = Buffer.from(response.value, "base64")
    return new TextDecoder("utf-8").decode(buffer)
  }

  override write = async (
    serviceId: string,
    characteristicId: string,
    message: string | Uint8Array | undefined,
    duration = 0,
    callback: WriteCallback = this.writeCallback,
  ): Promise<void> => {
    if (!this.device || message === undefined) {
      return Promise.resolve()
    }

    const service = this.services.find((entry) => entry.id === serviceId)
    const characteristic = service?.characteristics.find((char) => char.id === characteristicId)

    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }

    this.updateTimestamp()
    const valueToWrite = typeof message === "string" ? new TextEncoder().encode(message) : message
    const base64Value = Buffer.from(valueToWrite).toString("base64")

    await this.device.writeCharacteristicWithResponseForService(service.uuid, characteristic.uuid, base64Value)

    this.writeLast = message
    this.writeCallback = callback

    if (duration > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, duration))
    }
  }
}
