import { BaseModel } from "./../models/base.model"
import type { IDevice, Service } from "../interfaces/device.interface"
import type { massObject } from "./../types/notify"

let server: BluetoothRemoteGATTServer

/** Define the type for the callback function */
type NotifyCallback = (data: massObject) => void
/** Define the type for the callback function */
type WriteCallback = (data: string) => void

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
  /**
   * Reads the value of the specified characteristic from the device.
   * @param {string} serviceId - The service ID where the characteristic belongs.
   * @param {string} characteristicId - The characteristic ID to read from.
   * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
   * @returns {Promise<string>} A promise that resolves when the read operation is completed.
   */
  read = (serviceId: string, characteristicId: string, duration = 0): Promise<string> => {
    return new Promise((resolve, reject) => {
      if (this.isConnected()) {
        const characteristic = this.getCharacteristic(serviceId, characteristicId)

        if (characteristic) {
          characteristic
            .readValue()
            .then((value) => {
              let decodedValue: string
              const decoder = new TextDecoder("utf-8")
              switch (characteristicId) {
                case "level":
                  // TODO: This is battery specific.
                  decodedValue = value.getUint8(0).toString()
                  break
                default:
                  decodedValue = decoder.decode(value)
                  break
              }
              // Resolve after specified duration
              setTimeout(() => {
                return resolve(decodedValue)
              }, duration)
            })
            .catch((error) => {
              reject(error)
            })
        } else {
          reject(new Error("Characteristic is undefined"))
        }
      }
    })
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
    if (this.isConnected()) {
      // Check if message is provided
      if (message === undefined) {
        // If not provided, return without performing write operation
        return
      }
      // Get the characteristic from the device using serviceId and characteristicId
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
  /**
   * A default write callback that logs the response
   */
  writeCallback: WriteCallback = (data: string) => {
    console.log(data)
  }
  /**
   * The last message written to the device.
   * @type {string | Uint8Array | null}
   */
  writeLast: string | Uint8Array | null = null
}
