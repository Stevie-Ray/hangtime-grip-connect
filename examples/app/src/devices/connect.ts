import {
  Climbro,
  CTS500,
  Entralpi,
  ForceBoard,
  Motherboard,
  PB700BT,
  Progressor,
  SmartBoardPro,
  WHC06,
} from "@hangtime/grip-connect"
import type { ConnectedDevice } from "./session.js"
import { setActiveDevice } from "./session.js"

type SupportedDevice = ConnectedDevice

function createDevice(deviceKey: string): SupportedDevice | null {
  if (deviceKey === "climbro") return new Climbro()
  if (deviceKey === "cts500") return new CTS500()
  if (deviceKey === "entralpi") return new Entralpi()
  if (deviceKey === "forceboard") return new ForceBoard()
  if (deviceKey === "motherboard") return new Motherboard()
  if (deviceKey === "pb700bt") return new PB700BT()
  if (deviceKey === "progressor") return new Progressor()
  if (deviceKey === "smartboard") return new SmartBoardPro()
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
      async () => {
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
