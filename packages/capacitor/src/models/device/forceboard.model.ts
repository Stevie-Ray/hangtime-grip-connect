import { BleClient, type BleDevice } from "@capacitor-community/bluetooth-le"
import { ForceBoard as ForceBoardBase } from "@hangtime/grip-connect/src/index"
import type { WriteCallback } from "@hangtime/grip-connect/src/interfaces/callback.interface"

/**
 * Represents a PitchSix Force Board device.
 * {@link https://pitchsix.com}
 */
export class ForceBoard extends ForceBoardBase {
  device?: BleDevice

  override connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      const deviceServices = this.getAllServiceUUIDs()
      await BleClient.initialize()

      const filterOptions = Object.assign({}, ...this.filters);

      this.device = await BleClient.requestDevice({
        ...filterOptions,
        optionalServices: deviceServices
      });

      await BleClient.connect(this.device.deviceId, (deviceId) => console.log(deviceId))

      await this.onConnected(onSuccess)
    } catch (error) {
      onError(error as Error)
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
    const service = this.services
    .find((service) => service.id === serviceId)
    const characteristic = service?.characteristics.find((char) => char.id === characteristicId)

    if (!service || !characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }
    this.updateTimestamp()
    // Convert the message to Uint8Array if it's a string
    const valueToWrite = typeof message === "string" ? new TextEncoder().encode(message) : message
    // Write the value to the characteristic
    await BleClient.writeWithoutResponse(this.device.deviceId, service.uuid, characteristic.uuid, new DataView(valueToWrite.buffer))
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
