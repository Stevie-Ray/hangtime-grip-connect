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
}
