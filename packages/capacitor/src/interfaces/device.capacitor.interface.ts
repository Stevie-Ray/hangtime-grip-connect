import type { BleDevice, RequestBleDeviceOptions } from "@capacitor-community/bluetooth-le"
import type { IDevice } from "@hangtime/grip-connect/src/index"

export interface IDeviceCapacitor {
  filters?: RequestBleDeviceOptions[]
  services?: IDevice["services"]
  commands?: IDevice["commands"]
  device?: BleDevice
}
