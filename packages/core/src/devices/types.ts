/**
 * Represents a characteristic of a Bluetooth service.
 */
interface Characteristic {
  name: string // Name of the characteristic
  id: string // Identifier of the characteristic
  uuid: string // UUID of the characteristic
  characteristic?: BluetoothRemoteGATTCharacteristic // Reference to the characteristic object
}

/**
 * Represents a Bluetooth service.
 */
interface Service {
  name: string // Name of the service
  id: string // Identifier of the service
  uuid: string // UUID of the service
  characteristics: Characteristic[] // Array of characteristics belonging to this service
}

/**
 * Represents a Bluetooth device.
 */
export interface Device {
  name: string // Name of the device
  companyId?: number // Optional company identifier of the device
  services: Service[] // Array of services provided by the device
  device?: BluetoothDevice // Reference to the BluetoothDevice object representing this device
}
