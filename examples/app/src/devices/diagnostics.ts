import type { ConnectedDevice } from "./session.js"

interface BluetoothDeviceDetails {
  id?: unknown
  name?: unknown
}

interface DeviceWithBluetooth {
  bluetooth?: BluetoothDeviceDetails
}

export interface DeviceIdentifiers {
  browserId: string | null
  name: string | null
  serial: string | null
  serialError: string | null
  serialSupported: boolean
}

function cleanIdentifier(value: unknown): string | null {
  if (typeof value !== "string") return null
  const trimmed = value.trim()
  return trimmed || null
}

export async function readDeviceIdentifiers(device: ConnectedDevice): Promise<DeviceIdentifiers> {
  const bluetooth = (device as DeviceWithBluetooth).bluetooth
  const identifiers: DeviceIdentifiers = {
    browserId: cleanIdentifier(bluetooth?.id),
    name: cleanIdentifier(bluetooth?.name),
    serial: null,
    serialError: null,
    serialSupported: typeof device.serial === "function",
  }

  if (!identifiers.serialSupported) return identifiers

  try {
    identifiers.serial = cleanIdentifier(await device.serial?.())
  } catch (error: unknown) {
    identifiers.serialError = error instanceof Error && error.message ? error.message : "Read failed."
  }

  return identifiers
}

export function formatDeviceIdentifiers(identifiers: DeviceIdentifiers): string {
  const serial = identifiers.serialSupported
    ? (identifiers.serial ?? identifiers.serialError ?? "Unavailable")
    : "Unsupported"

  return [
    "Device identifiers",
    `Name: ${identifiers.name ?? "Unavailable"}`,
    `Browser ID: ${identifiers.browserId ?? "Unavailable"}`,
    `Serial: ${serial}`,
  ].join("\n")
}
