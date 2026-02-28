import type { ForceMeasurement, ForceUnit } from "@hangtime/grip-connect"

export interface ConnectedDevice {
  connect(success: () => void, error?: (error: Error) => void): Promise<void>
  isConnected?(): boolean
  notify(callback: (data: ForceMeasurement) => void, unit?: ForceUnit): void
  stream?(duration?: number): Promise<void>
  stop?(): Promise<void>
  tare?(duration?: number): boolean
  battery?(): Promise<string | undefined>
  firmware?(): Promise<string | undefined>
  calibration?(): Promise<string | undefined>
  setCalibration?(curve: Uint8Array): Promise<void>
  addCalibrationPoint?(): Promise<void>
  saveCalibration?(): Promise<void>
  errorInfo?(): Promise<string | undefined>
  clearErrorInfo?(): Promise<void>
}

let activeDevice: ConnectedDevice | null = null

export function setActiveDevice(device: ConnectedDevice | null): void {
  activeDevice = device
}

export function getActiveDevice(): ConnectedDevice | null {
  return activeDevice
}
