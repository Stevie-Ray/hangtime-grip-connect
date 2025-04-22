import type { IDevice } from "../interfaces/device.interface"
import { Device } from "./device.model"
import { BleClient, type BleDevice, type RequestBleDeviceOptions } from "@capacitor-community/bluetooth-le"

// Interface for Capacitor devices, that extends IDevice where possible
interface ICapacitorDevice {
  filters?: RequestBleDeviceOptions[]
  services?: IDevice["services"]
  commands?: IDevice["commands"]
  device?: BleDevice
}

export abstract class Capacitor extends Device {
  filters: RequestBleDeviceOptions[]
  device?: BleDevice

  constructor(device: Partial<ICapacitorDevice>) {
    // Convert Capacitor device to base Device format
    const baseDevice: Partial<IDevice> = {
      filters: device.filters,
      services: device.services,
      commands: device.commands,
    }

    super(baseDevice)

    this.filters = device.filters || []
    this.device = device.device

    this.massMax = "0"
    this.massAverage = "0"
    this.massTotalSum = 0
    this.dataPointCount = 0

    this.createdAt = new Date()
    this.updatedAt = new Date()
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
              this.handleDataNotifications(value)
            })
          }
        }
      }
    }
    onSuccess()
  }

  // TODO: make override of handleNotifications, and make sure it uses DataView.
  handleDataNotifications = (value: DataView): void => {
    if (!value) return

    this.updateTimestamp()
    // Received notification data
    console.log(value)
  }
}
