import { BaseModel } from "./../models/base.model"
import type { IDevice, Service } from "../interfaces/device.interface"
import type { massObject } from "./../types/notify"

let server: BluetoothRemoteGATTServer

/** Define the type for the callback function */
type NotifyCallback = (data: massObject) => void

export class Device extends BaseModel implements IDevice {
  filters: BluetoothLEScanFilter[]
  services: Service[]
  bluetooth?: BluetoothDevice | undefined

  constructor(device: Partial<IDevice>) {
    super(device)

    this.filters = device.filters || []
    this.services = device.services || []
    this.bluetooth = device.bluetooth
  }
  /**
   * Connects to a Bluetooth device.
   * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
   * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
   */
  connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      // Request device and set up connection
      const deviceServices = this.getAllServiceUUIDs()

      this.bluetooth = await navigator.bluetooth.requestDevice({
        filters: this.filters,
        optionalServices: deviceServices,
      })

      if (!this.bluetooth.gatt) {
        throw new Error("GATT is not available on this device")
      }

      this.bluetooth.addEventListener("gattserverdisconnected", (event) => {
        this.onDisconnected(event)
      })

      server = await this.bluetooth.gatt.connect()

      if (server.connected) {
        await this.onConnected(onSuccess)
      }
    } catch (error) {
      onError(error as Error)
    }
  }
  /**
   * Disconnects the device if it is currently connected.
   * - Checks if the device is connected via it's GATT server.
   * - If the device is connected, it attempts to gracefully disconnect.
   */
  disconnect = (): void => {
    // Verify that the device is connected using the provided helper function
    if (this.isConnected()) {
      // Safely attempt to disconnect the device's GATT server, if available
      this.bluetooth?.gatt?.disconnect()
    }
  }
  /**
   * Returns UUIDs of all services associated with the device.
   * @returns {string[]} Array of service UUIDs.
   */
  getAllServiceUUIDs = () => {
    return this.services.map((service) => service.uuid)
  }
  /**
   * Handles notifications received from a characteristic.
   * @param {Event} event - The notification event.
   */
  handleNotifications = (event: Event): void => {
    const characteristic: BluetoothRemoteGATTCharacteristic = event.target as BluetoothRemoteGATTCharacteristic
    const value: DataView | undefined = characteristic.value

    if (value) {
      if (value.buffer) {
        const buffer: ArrayBuffer = value.buffer
        console.log(new Uint8Array(buffer))
        const rawData: DataView = new DataView(buffer)
        console.log(rawData)
      } else {
        console.log(value)
      }
    }
  }
  /**
   * Checks if a Bluetooth device is connected.
   * @returns {boolean} A boolean indicating whether the device is connected.
   */
  isConnected = (): boolean => {
    // Check if the device is defined and available
    if (!this?.bluetooth) {
      return false
    }
    // Check if the device is connected
    return !!this.bluetooth.gatt?.connected
  }
  /**
   * Sets the callback function to be called when notifications are received.
   * @param {NotifyCallback} callback - The callback function to be set.
   * @returns {void}
   */
  notify = (callback: NotifyCallback): void => {
    this.notifyCallback = callback
  }
  /**
   * Defines the type for the callback function.
   * @callback NotifyCallback
   * @param {massObject} data - The data passed to the callback.
   */
  notifyCallback: NotifyCallback = (data) => console.log(data)
  /**
   * Handles the 'connected' event.
   * @param {Function} onSuccess - Callback function to execute on successful connection.
   */
  onConnected = async (onSuccess: () => void): Promise<void> => {
    // Connect to GATT server and set up characteristics
    const services: BluetoothRemoteGATTService[] = await server.getPrimaryServices()

    if (!services || services.length === 0) {
      throw new Error("No services found")
    }

    for (const service of services) {
      const matchingService = this.services.find((boardService) => boardService.uuid === service.uuid)

      if (matchingService) {
        // Android bug: Introduce a delay before getting characteristics
        await new Promise((resolve) => setTimeout(resolve, 100))

        const characteristics = await service.getCharacteristics()

        for (const characteristic of matchingService.characteristics) {
          const matchingCharacteristic = characteristics.find((char) => char.uuid === characteristic.uuid)

          if (matchingCharacteristic) {
            const element = matchingService.characteristics.find((char) => char.uuid === matchingCharacteristic.uuid)
            if (element) {
              element.characteristic = matchingCharacteristic

              // notify
              if (element.id === "rx") {
                matchingCharacteristic.startNotifications()
                matchingCharacteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
                  this.handleNotifications(event)
                })
              }
            }
          } else {
            throw new Error(`Characteristic ${characteristic.uuid} not found in service ${service.uuid}`)
          }
        }
      }
    }

    // Call the onSuccess callback after successful connection and setup
    onSuccess()
  }
  /**
   * Handles the 'disconnected' event.
   * @param {Event} event - The 'disconnected' event.
   */
  onDisconnected = (event: Event): void => {
    this.bluetooth = undefined
    const device = event.target as BluetoothDevice
    throw new Error(`Device ${device.name} is disconnected.`)
  }
}
