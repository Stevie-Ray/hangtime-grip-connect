# Device API Reference

All devices have the following functions:

```ts
  /** Filters to indentify the device */
  filters: BluetoothLEScanFilter[]
  /** Array of services provided by the device */
  services: Service[]
  /** Reference to the BluetoothDevice object representing this device */
  bluetooth?: BluetoothDevice

  /**
   * Handles the 'disconnected' event.
   * @param {Event} event - The 'disconnected' event.
   */
  onDisconnected(event: Event): void

  /**
   * Handles notifications received from a characteristic.
   * @param {Event} event - The notification event.
   */
  handleNotifications(event: Event): void

  /**
   * Handles the 'connected' event.
   * @param {Function} onSuccess - Callback function to execute on successful connection.
   */
  onConnected(onSuccess: () => void): Promise<void>

  /**
   * Returns UUIDs of all services associated with the device.
   * @returns {string[]} Array of service UUIDs.
   */
  getAllServiceUUIDs(): string[]

  /**
   * Connects to a Bluetooth device.
   * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
   * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
   */
  connect(onSuccess?: () => void, onError?: (error: Error) => void): Promise<void>

  /**
   * Checks if a Bluetooth device is connected.
   * @returns {boolean} A boolean indicating whether the device is connected.
   */
  isConnected(): boolean

  /**
   * Disconnects the device if it is currently connected.
   * - Checks if the device is connected via it's GATT server.
   * - If the device is connected, it attempts to gracefully disconnect.
   */
  disconnect(): void
```

### Device specific features

- [Climbro](/devices/climbro)
- [Entralpi](/devices/entralpi)
- [ForceBoard](/devices/foreboard)
- [KilterBoard](/devices/kilterboard)
- [MotherBoard](/devices/motherboard)
- [mySmartBoard](/devices/mysmartboard)
- [Progressor](/devices/progressor)
- [WH-C06](/devices/wh-c06)
