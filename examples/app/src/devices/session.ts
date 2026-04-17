import type { ForceMeasurement, ForceUnit } from "@hangtime/grip-connect"
import type { DeviceBaudRate, DeviceSamplingRate } from "../settings/rates.js"

export interface ConnectedDevice {
  connect(success: () => void, error?: (error: Error) => void): Promise<void>
  disconnect?(): void | Promise<void>
  isConnected?(): boolean
  notify(callback: (data: ForceMeasurement) => void, unit?: ForceUnit): void
  stream?(duration?: number): Promise<void>
  stop?(): Promise<void>
  tare?(duration?: number): boolean
  battery?(): Promise<string | undefined>
  firmware?(): Promise<string | undefined>
  setBaudRate?(baudRate: DeviceBaudRate): Promise<void>
  setSamplingRate?(samplingRate: DeviceSamplingRate): Promise<void>
  calibration?(): Promise<unknown>
  setCalibration?(curve: Uint8Array): Promise<void>
  addCalibrationPoint?(): Promise<void>
  saveCalibration?(): Promise<void>
  errorInfo?(): Promise<string | undefined>
  clearErrorInfo?(): Promise<void>
  dfuUpload?(initPacket: Uint8Array | ArrayBuffer, firmware: Uint8Array | ArrayBuffer): Promise<void>
}

let activeDevice: ConnectedDevice | null = null
let activeDeviceKey: string | null = null

export function setActiveDevice(device: ConnectedDevice | null, deviceKey?: string): void {
  activeDevice = device
  activeDeviceKey = device && deviceKey ? deviceKey : null
}

export function getActiveDevice(): ConnectedDevice | null {
  return activeDevice
}

export function getActiveDeviceKey(): string | null {
  return activeDeviceKey
}
