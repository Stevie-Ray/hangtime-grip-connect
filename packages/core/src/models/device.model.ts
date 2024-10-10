import { BaseModel } from "./../models/base.model"
import type { IDevice, Service } from "../interfaces/device.interface"
import type { NotifyCallback, massObject, WriteCallback } from "../interfaces/callback.interface"
import type { Commands } from "../interfaces/command.interface"

export abstract class Device extends BaseModel implements IDevice {
  /**
   * Filters to identify the device during Bluetooth scanning.
   * Used to match devices that meet specific criteria such as name, service UUIDs, etc.
   */
  public filters: BluetoothLEScanFilter[]

  /**
   * Array of services provided by the device.
   * Services represent functionalities that the device supports, such as weight measurement, battery information, or custom services.
   */
  public services: Service[]

  /**
   * Reference to the `BluetoothDevice` object representing this device.
   * This is the actual device object obtained from the Web Bluetooth API after a successful connection.
   */
  public bluetooth?: BluetoothDevice | undefined

  /**
   * Object representing the set of commands available for this device.
   * These commands allow communication with the device to perform various operations such as starting measurements, retrieving data, or calibrating the device.
   */
  public commands: Commands

  /**
   * The BluetoothRemoteGATTServer interface of the Web Bluetooth API represents a GATT Server on a remote device.
   */
  private server: BluetoothRemoteGATTServer | undefined

  /**
   * Maximum mass recorded from the device, initialized to "0".
   * @type {string}
   * @protected
   */
  protected massMax: string

  /**
   * Average mass calculated from the device data, initialized to "0".
   * @type {string}
   * @protected
   */
  protected massAverage: string

  /**
   * Total sum of all mass data points recorded from the device.
   * Used to calculate the average mass.
   * @type {number}
   * @protected
   */
  protected massTotalSum: number

  /**
   * Number of data points received from the device.
   * Used to calculate the average mass.
   * @type {number}
   * @protected
   */
  protected dataPointCount: number

  /**
   * Optional callback for handling write operations.
   * @callback NotifyCallback
   * @param {massObject} data - The data passed to the callback.
   * @type {NotifyCallback | undefined}
   * @protected
   */
  protected notifyCallback: NotifyCallback = (data: massObject) => console.log(data)

  /**
   * Optional callback for handling write operations.
   * @callback WriteCallback
   * @param {string} data - The data passed to the callback.
   * @type {WriteCallback | undefined}
   * @protected
   */
  protected writeCallback: WriteCallback = (data: string) => console.log(data)

  /**
   * The last message written to the device.
   * @type {string | Uint8Array | null}
   */
  protected writeLast: string | Uint8Array | null = null

  constructor(device: Partial<IDevice>) {
    super(device)

    this.filters = device.filters || []
    this.services = device.services || []
    this.commands = device.commands || {}
    this.bluetooth = device.bluetooth

    this.massMax = "0"
    this.massAverage = "0"
    this.massTotalSum = 0
    this.dataPointCount = 0
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

      this.server = await this.bluetooth.gatt.connect()

      if (this.server.connected) {
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
   * Retrieves the characteristic from the device's service.
   * @param {string} serviceId - The UUID of the service.
   * @param {string} characteristicId - The UUID of the characteristic.
   * @returns {BluetoothRemoteGATTCharacteristic | undefined} The characteristic, if found.
   */
  getCharacteristic = (serviceId: string, characteristicId: string): BluetoothRemoteGATTCharacteristic | undefined => {
    // Find the service with the specified serviceId
    const boardService = this.services.find((service) => service.id === serviceId)
    if (boardService) {
      // If the service is found, find the characteristic with the specified characteristicId
      const boardCharacteristic = boardService.characteristics.find(
        (characteristic) => characteristic.id === characteristicId,
      )
      if (boardCharacteristic) {
        // If the characteristic is found, return it
        return boardCharacteristic.characteristic
      }
    }
    // Return undefined if the service or characteristic is not found
    return undefined
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
   * Handles the 'connected' event.
   * @param {Function} onSuccess - Callback function to execute on successful connection.
   */
  onConnected = async (onSuccess: () => void): Promise<void> => {
    // Connect to GATT server and set up characteristics
    const services: BluetoothRemoteGATTService[] | undefined = await this.server?.getPrimaryServices()

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
  /**
   * Reads the value of the specified characteristic from the device.
   * @param {string} serviceId - The service ID where the characteristic belongs.
   * @param {string} characteristicId - The characteristic ID to read from.
   * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
   * @returns {Promise<string | undefined>} A promise that resolves when the read operation is completed.
   */
  read = async (serviceId: string, characteristicId: string, duration = 0): Promise<string | undefined> => {
    if (!this.isConnected()) {
      return undefined
    }
    // Get the characteristic from the service
    const characteristic = this.getCharacteristic(serviceId, characteristicId)
    if (!characteristic) {
      throw new Error("Characteristic is undefined")
    }
    // Decode the value based on characteristicId and serviceId
    let decodedValue: string
    const decoder = new TextDecoder("utf-8")
    // Read the value from the characteristic
    const value = await characteristic.readValue()

    if (serviceId === "battery" && characteristicId === "level") {
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
  /**
   * Writes a message to the specified characteristic of a Bluetooth device and optionally provides a callback to handle responses.
   * @param {string} serviceId - The service UUID of the Bluetooth device containing the target characteristic.
   * @param {string} characteristicId - The characteristic UUID where the message will be written.
   * @param {string | Uint8Array | undefined} message - The message to be written to the characteristic. It can be a string or a Uint8Array.
   * @param {number} [duration=0] - Optional. The time in milliseconds to wait before resolving the promise. Defaults to 0 for immediate resolution.
   * @param {WriteCallback} [callback=writeCallback] - Optional. A custom callback to handle the response after the write operation is successful.
   *
   * @returns {Promise<void>} A promise that resolves once the write operation is complete.
   *
   * @throws {Error} Throws an error if the characteristic is undefined.
   *
   * @example
   * // Example usage of the write function with a custom callback
   * await Progressor.write("progressor", "tx", ProgressorCommands.GET_BATT_VLTG, 250, (data) => {
   *   console.log(`Battery voltage: ${data}`);
   * });
   */
  write = async (
    serviceId: string,
    characteristicId: string,
    message: string | Uint8Array | undefined,
    duration = 0,
    callback: WriteCallback = this.writeCallback,
  ): Promise<void> => {
    // Check if not connected or no message is provided
    if (!this.isConnected() || message === undefined) {
      return undefined
    }
    // Get the characteristic from the service
    const characteristic = this.getCharacteristic(serviceId, characteristicId)
    if (!characteristic) {
      throw new Error("Characteristic is undefined")
    }
    // Convert the message to Uint8Array if it's a string
    const valueToWrite: Uint8Array = typeof message === "string" ? new TextEncoder().encode(message) : message
    // Write the value to the characteristic
    await characteristic.writeValue(valueToWrite)
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
