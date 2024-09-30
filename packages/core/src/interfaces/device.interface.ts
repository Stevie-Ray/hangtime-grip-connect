import type { IBase } from "./base.interface"

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
}
