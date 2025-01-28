import type { IBase } from "./base.interface.js"
import type { massObject } from "./callback.interface.js"
import type { Commands } from "./command.interface.js"

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
  /**
   * Filters to identify the device during Bluetooth scanning.
   * Used to match devices that meet specific criteria such as name, service UUIDs, etc.
   * @type {BluetoothLEScanFilter[]}
   * @public
   * @readonly
   */
  filters: BluetoothLEScanFilter[]

  /**
   * Array of services provided by the device.
   * Services represent functionalities that the device supports, such as weight measurement, battery information, or custom services.
   * @type {Service[]}
   * @public
   * @readonly
   */
  services: Service[]

  /**
   * Reference to the `BluetoothDevice` object representing this device.
   * This is the actual device object obtained from the Web Bluetooth API after a successful connection.
   * @type {BluetoothDevice | undefined}
   * @public
   */
  bluetooth?: BluetoothDevice

  /**
   * Object representing the set of commands available for this device.
   * These commands allow communication with the device to perform various operations such as starting measurements, retrieving data, or calibrating the device.
   * @type {Commands}
   * @public
   * @readonly
   */
  commands: Commands

  /**
   * Sets the callback function to be called when the activity status changes,
   * and optionally sets the configuration for threshold and duration.
   *
   * This function allows you to specify a callback that will be invoked whenever
   * the activity status changes, indicating whether the device is currently active.
   * It also allows optionally configuring the threshold and duration used to determine activity.
   *
   * @param {ActiveCallback} callback - The callback function to be set. This function
   *                                      receives a boolean value indicating the new activity status.
   * @param {object} [options] - Optional configuration object containing the threshold and duration.
   * @param {number} [options.threshold=2.5] - The threshold value for determining activity.
   * @param {number} [options.duration=1000] - The duration (in milliseconds) to monitor the input for activity.
   * @returns {void}
   * @public
   *
   * @example
   * device.active((isActive) => {
   *   console.log(`Device is ${isActive ? 'active' : 'inactive'}`);
   * }, { threshold: 3.0, duration: 1500 });
   */
  active(callback?: (data: boolean) => void, options?: { threshold?: number; duration?: number }): void

  /**
   * Connects to a Bluetooth device.
   * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
   * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
   * @public
   *
   * @example
   * device.connect(
   *   () => console.log("Connected successfully"),
   *   (error) => console.error("Connection failed:", error)
   * );
   */
  connect(onSuccess?: () => void, onError?: (error: Error) => void): Promise<void>

  /**
   * Disconnects the device if it is currently connected.
   * - Removes all notification listeners from the device's characteristics.
   * - Removes the 'gattserverdisconnected' event listener.
   * - Attempts to gracefully disconnect the device's GATT server.
   * - Resets relevant properties to their initial states.
   * @returns {void}
   * @public
   *
   * @example
   * device.disconnect();
   */
  disconnect(): void

  /**
   * Exports the data in the specified format (CSV, JSON, XML) with a filename format:
   * 'data-export-YYYY-MM-DD-HH-MM-SS.{format}'.
   *
   * @param {('csv' | 'json' | 'xml')} [format='csv'] - The format in which to download the data.
   * Defaults to 'csv'. Accepted values are 'csv', 'json', and 'xml'.
   *
   * @returns {void} Initiates a download of the data in the specified format.
   * @private
   *
   * @example
   * device.download('json');
   */
  download(format?: "csv" | "json" | "xml"): void

  /**
   * Checks if a Bluetooth device is connected.
   * @returns {boolean} A boolean indicating whether the device is connected.
   * @public
   *
   * @example
   * if (device.isConnected()) {
   *   console.log('Device is connected');
   * } else {
   *   console.log('Device is not connected');
   * }
   */
  isConnected(): boolean

  /**
   * Sets the callback function to be called when notifications are received.
   * @param {NotifyCallback} callback - The callback function to be set.
   * @returns {void}
   * @public
   *
   * @example
   * device.notify((data) => {
   *   console.log('Received notification:', data);
   * });
   */
  notify(callback: (data: massObject) => void): void

  /**
   * Reads the value of the specified characteristic from the device.
   * @param {string} serviceId - The service ID where the characteristic belongs.
   * @param {string} characteristicId - The characteristic ID to read from.
   * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
   * @returns {Promise<string | undefined>} A promise that resolves when the read operation is completed.
   * @public
   *
   * @example
   * const value = await device.read('battery', 'level', 1000);
   * console.log('Battery level:', value);
   */
  read(serviceId: string, characteristicId: string, duration?: number): Promise<string | undefined>

  /**
   * Initiates the tare calibration process.
   * @param {number} duration - The duration time for tare calibration.
   * @returns {boolean} A boolean indicating whether the tare calibration was successful.
   * @public
   *
   * @example
   * const success = device.tare(5000);
   * if (success) {
   *   console.log('Tare calibration started');
   * } else {
   *   console.log('Tare calibration failed to start');
   * }
   */
  tare(duration?: number): boolean

  /**
   * Writes a message to the specified characteristic of a Bluetooth device and optionally provides a callback to handle responses.
   * @param {string} serviceId - The service UUID of the Bluetooth device containing the target characteristic.
   * @param {string} characteristicId - The characteristic UUID where the message will be written.
   * @param {string | Uint8Array | undefined} message - The message to be written to the characteristic. It can be a string or a Uint8Array.
   * @param {number} [duration=0] - Optional. The time in milliseconds to wait before resolving the promise. Defaults to 0 for immediate resolution.
   * @param {WriteCallback} [callback=writeCallback] - Optional. A custom callback to handle the response after the write operation is successful.
   * @returns {Promise<void>} A promise that resolves once the write operation is complete.
   * @public
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
