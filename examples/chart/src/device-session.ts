import type { ForceMeasurement, ForceUnit } from "@hangtime/grip-connect"

export interface ConnectedDevice {
  connect(success: () => Promise<void>, error?: (error: Error) => void): Promise<void>
  notify(callback: (data: ForceMeasurement) => void, unit?: ForceUnit): void
  stream?(duration?: number): Promise<void>
  stop?(): Promise<void>
}

let activeDevice: ConnectedDevice | null = null

export function setActiveDevice(device: ConnectedDevice | null): void {
  activeDevice = device
}

export function getActiveDevice(): ConnectedDevice | null {
  return activeDevice
}
