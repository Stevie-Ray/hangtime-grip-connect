interface Characteristic {
  name: string
  id: string
  uuid: string
  characteristic?: BluetoothRemoteGATTCharacteristic
}

interface Service {
  name: string
  id: string
  uuid: string
  characteristics: Characteristic[]
}

export interface Device {
  name: string
  companyId?: number
  services: Service[]
  device?: BluetoothDevice
}
