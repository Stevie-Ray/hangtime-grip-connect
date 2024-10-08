import type { IBase } from "./base.interface"
import type { massObject } from "./callback.interface"

/**
 * Represents a characteristic of a Bluetooth service.
 */
interface Characteristic {
  /** Name of the characteristic */
  name: string
  /** Identifier of the characteristic */
  id: string
  /** UUID of the characteristic */
  uuid: string
  /** Reference to the characteristic object */
  characteristic?: BluetoothRemoteGATTCharacteristic
}

/**
 * Represents a Bluetooth service.
 */
export interface Service {
  /**  Name of the service */
  name: string
  /** Identifier of the service */
  id: string
  /** UUID of the service */
  uuid: string
  /** Array of characteristics belonging to this service */
  characteristics: Characteristic[]
}

/**
 * Represents a Bluetooth device.
 */
export interface IDevice extends IBase {
  /** Filters to indentify the device */
  filters: BluetoothLEScanFilter[]
  /** Array of services provided by the device */
  services: Service[]
  /** Reference to the BluetoothDevice object representing this device */
  bluetooth?: BluetoothDevice

  /**
   * Connects to a Bluetooth device.
   * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
   * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
   */
  connect(onSuccess?: () => void, onError?: (error: Error) => void): Promise<void>

  /**
   * Disconnects the device if it is currently connected.
   * - Checks if the device is connected via it's GATT server.
   * - If the device is connected, it attempts to gracefully disconnect.
   */
  disconnect(): void

  /**
   * Returns UUIDs of all services associated with the device.
   * @returns {string[]} Array of service UUIDs.
   */
  getAllServiceUUIDs(): string[]

  /**
   * Retrieves the characteristic from the device's service.
   * @param {string} serviceId - The UUID of the service.
   * @param {string} characteristicId - The UUID of the characteristic.
   * @returns {BluetoothRemoteGATTCharacteristic | undefined} The characteristic, if found.
   */
  getCharacteristic(serviceId: string, characteristicId: string): BluetoothRemoteGATTCharacteristic | undefined

  /**
   * Handles notifications received from a characteristic.
   * @param {Event} event - The notification event.
   */
  handleNotifications(event: Event): void

  /**
   * Checks if a Bluetooth device is connected.
   * @returns {boolean} A boolean indicating whether the device is connected.
   */
  isConnected(): boolean

  /**
   * Sets the callback function to be called when notifications are received.
   * @param {NotifyCallback} callback - The callback function to be set.
   * @returns {void}
   */
  notify(callback: (data: massObject) => void): void

  /**
   * Handles the 'connected' event.
   * @param {Function} onSuccess - Callback function to execute on successful connection.
   */
  onConnected(onSuccess: () => void): Promise<void>

  /**
   * Handles the 'disconnected' event.
   * @param {Event} event - The 'disconnected' event.
   */
  onDisconnected(event: Event): void

  /**
   * Reads the value of the specified characteristic from the device.
   * @param {string} serviceId - The service ID where the characteristic belongs.
   * @param {string} characteristicId - The characteristic ID to read from.
   * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
   * @returns {Promise<string>} A promise that resolves when the read operation is completed.
   */
  read(serviceId: string, characteristicId: string, duration?: number): Promise<string>

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
  write(
    serviceId: string,
    characteristicId: string,
    message: string | Uint8Array | undefined,
    duration?: number,
    callback?: (data: string) => void,
  ): Promise<void>
}
