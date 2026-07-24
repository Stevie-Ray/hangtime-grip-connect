import {
  Climbro,
  CTS500,
  Entralpi,
  ForceBoard,
  FrezDyno,
  Motherboard,
  PB700BT,
  Progressor,
  SmartBoardPro,
  WHC06,
} from "@hangtime/grip-connect"
import type { ConnectedDevice } from "./session.js"
import { setActiveDevice } from "./session.js"
import { getBluetoothDeviceId } from "./diagnostics.js"
import {
  loadFrezDynoCoefficientCache,
  loadFrezDynoSerialNumber,
  loadPreferences,
  saveFrezDynoCoefficientCache,
} from "../settings/storage.js"

type SupportedDevice = ConnectedDevice

function applySavedFrezDynoSerial(device: SupportedDevice): void {
  if (!device.setDeviceSerialNumber) return
  const serialNumber = loadFrezDynoSerialNumber(getBluetoothDeviceId(device))
  if (serialNumber) device.setDeviceSerialNumber(serialNumber)
}

function createDevice(deviceKey: string): SupportedDevice | null {
  if (deviceKey === "climbro") return new Climbro()
  if (deviceKey === "cts500") return new CTS500()
  if (deviceKey === "entralpi") return new Entralpi()
  if (deviceKey === "forceboard") return new ForceBoard()
  if (deviceKey === "dyno") {
    const preferences = loadPreferences()
    return new FrezDyno({
      ...(preferences.frezDynoCoefficient ? { coefficient: preferences.frezDynoCoefficient } : {}),
      coefficientLookup: async (params) => {
        const cachedCoefficient = loadFrezDynoCoefficientCache(params)
        if (cachedCoefficient) return cachedCoefficient

        const name = params.deviceName?.trim()
        if (!name) throw new Error("Frez Dyno Web Bluetooth coefficient lookup requires the device name.")
        const response = await fetch(`/api/frez-dyno/coefficient?name=${encodeURIComponent(name)}`)
        const body = (await response.json()) as { a?: unknown; error?: unknown }
        if (!response.ok || typeof body.a !== "number") {
          throw new Error(typeof body.error === "string" ? body.error : "Frez Dyno coefficient request failed.")
        }
        saveFrezDynoCoefficientCache(params, body.a)
        return body.a
      },
    })
  }
  if (deviceKey === "motherboard") return new Motherboard()
  if (deviceKey === "pb700bt") return new PB700BT()
  if (deviceKey === "progressor") return new Progressor()
  if (deviceKey === "smartboardpro") return new SmartBoardPro()
  if (deviceKey === "whc06") return new WHC06()
  return null
}

export async function connectSelectedDevice(
  deviceKey: string,
  deviceName: string,
  statusElement: HTMLElement | null,
): Promise<boolean> {
  const device = createDevice(deviceKey)
  if (!device) {
    if (statusElement) statusElement.textContent = "Unsupported device."
    return false
  }

  if (statusElement) statusElement.textContent = `Connecting to ${deviceName}...`

  let connected = false
  let connectError: Error | null = null
  try {
    await device.connect(
      () => {
        applySavedFrezDynoSerial(device)
        connected = true
        setActiveDevice(device, deviceKey)
        if (statusElement) statusElement.textContent = `Connected to ${deviceName}.`
      },
      (error: Error) => {
        connectError = error
        if (statusElement) statusElement.textContent = error.message
      },
    )
    if (!connected && !connectError && device.isConnected?.()) {
      applySavedFrezDynoSerial(device)
      connected = true
      setActiveDevice(device, deviceKey)
      if (statusElement) statusElement.textContent = `Connected to ${deviceName}.`
    }
    return connected
  } catch (error: unknown) {
    if (statusElement) {
      statusElement.textContent = error instanceof Error ? error.message : "Connection failed."
    }
    return false
  }
}
