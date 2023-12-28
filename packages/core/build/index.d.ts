/// <reference types="web-bluetooth" />
interface Motherboard {
  device?: BluetoothDevice
  devSn?: BluetoothRemoteGATTCharacteristic
  devFr?: BluetoothRemoteGATTCharacteristic
  devHr?: BluetoothRemoteGATTCharacteristic
  devMn?: BluetoothRemoteGATTCharacteristic
  bat?: BluetoothRemoteGATTCharacteristic
  led01?: BluetoothRemoteGATTCharacteristic
  led02?: BluetoothRemoteGATTCharacteristic
  uartTx?: BluetoothRemoteGATTCharacteristic
  uartRx?: BluetoothRemoteGATTCharacteristic
}
declare const motherboard: Motherboard
declare const connect: () => void
declare const disconnect: () => void
export default motherboard
export { disconnect, connect }
