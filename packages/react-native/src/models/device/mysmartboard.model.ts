import { BleManager, Device } from "react-native-ble-plx"
import { mySmartBoard as mySmartBoardBase } from "@hangtime/grip-connect/src/index"
import type { WriteCallback } from "@hangtime/grip-connect/src/interfaces/callback.interface"

/**
 * Represents a Smartboard Climbing mySmartBoard device.
 * TODO: Add services, do you own a mySmartBoard? Help us!
 * {@link https://www.smartboard-climbing.com}
 */
export class mySmartBoard extends mySmartBoardBase {
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
      await this.manager.enable()

      const filterOptions = Object.assign({}, ...this.filters)

      this.manager.startDeviceScan(filterOptions, { scanMode: 2, callbackType: 1 }, (error, scannedDevice) => {
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
            await this.device.monitorCharacteristicForService(
              service.uuid,
              characteristic.uuid,
              (error, characteristic) => {
                if (error) {
                  console.error(error)
                  return
                }
                if (characteristic?.value) {
                  const value = characteristic.value
                  const buffer = new Uint8Array(value.length)
                  for (let i = 0; i < value.length; i++) {
                    buffer[i] = value.charCodeAt(i)
                  }
                  this.handleNotifications(new DataView(buffer.buffer))
                }
              },
            )
          }
        }
      }
    }
    onSuccess()
  }

  read = async (serviceId: string, characteristicId: string, duration = 0): Promise<string | undefined> => {
    if (!this.device) {
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
    // Read the value from the characteristic
    const value = await this.device.readCharacteristicForService(service.uuid, characteristic.uuid)

    if (!value.value) {
      return undefined
    }

    if (
      (serviceId === "battery" || serviceId === "humidity" || serviceId === "temperature") &&
      characteristicId === "level"
    ) {
      // This is battery-specific; return the first byte as the level
      const buffer = new Uint8Array(value.value.length)
      for (let i = 0; i < value.value.length; i++) {
        buffer[i] = value.value.charCodeAt(i)
      }
      decodedValue = new DataView(buffer.buffer).getUint8(0).toString()
    } else {
      // Otherwise use the value directly
      decodedValue = value.value
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
    const valueToWrite = typeof message === "string" ? message : String.fromCharCode(...message)
    // Write the value to the characteristic
    await this.device.writeCharacteristicWithoutResponseForService(service.uuid, characteristic.uuid, valueToWrite)
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
