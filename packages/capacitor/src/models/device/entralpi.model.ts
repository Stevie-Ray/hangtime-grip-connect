import { BleClient, type BleDevice, type RequestBleDeviceOptions } from "@capacitor-community/bluetooth-le"
import { Entralpi as EntralpiBase } from "@hangtime/grip-connect/src/index"
import type { IDeviceCapacitor } from "../../interface/device.capacitor.interface"

/**
 * Represents a Entralpi device.
 * {@link https://entralpi.com}
 */
export class Entralpi extends EntralpiBase {
  filters: RequestBleDeviceOptions[]
  device?: BleDevice

  constructor(device: Partial<IDeviceCapacitor>) {
    super()

    this.filters = device.filters || []
    this.device = device.device
  }

  override connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      const deviceServices = this.getAllServiceUUIDs()
      await BleClient.initialize()

      this.device = await BleClient.requestDevice({
        ...this.filters,
        optionalServices: deviceServices,
      })

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
}
