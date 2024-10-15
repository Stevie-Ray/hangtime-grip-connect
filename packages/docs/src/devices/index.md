# Device API Reference

All devices have the following functions:

```ts
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
   * Connects to a Bluetooth device.
   * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
   * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
   * @public
   */
  connect(onSuccess?: () => void, onError?: (error: Error) => void): Promise<void>

  /**
   * Disconnects the device if it is currently connected.
   * - Checks if the device is connected via it's GATT server.
   * - If the device is connected, it attempts to gracefully disconnect.
   * @public
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
   */
  download(format?: "csv" | "json" | "xml"): void

  /**
   * Checks if a Bluetooth device is connected.
   * @returns {boolean} A boolean indicating whether the device is connected.
   * @public
   */
  isConnected(): boolean

  /**
   * Sets the callback function to be called when notifications are received.
   * @param {NotifyCallback} callback - The callback function to be set.
   * @returns {void}
   * @public
   */
  notify(callback: (data: massObject) => void): void

  /**
   * Reads the value of the specified characteristic from the device.
   * @param {string} serviceId - The service ID where the characteristic belongs.
   * @param {string} characteristicId - The characteristic ID to read from.
   * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
   * @returns {Promise<string | undefined>} A promise that resolves when the read operation is completed.
   * @public
   */
  read(serviceId: string, characteristicId: string, duration?: number): Promise<string | undefined>

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
```

### Device specific features

- [Climbro](/devices/climbro)
- [Entralpi](/devices/entralpi)
- [ForceBoard](/devices/forceboard)
- [KilterBoard](/devices/kilterboard)
- [MotherBoard](/devices/motherboard)
- [mySmartBoard](/devices/mysmartboard)
- [Progressor](/devices/progressor)
- [WH-C06](/devices/wh-c06)
