import { BleManager } from "react-native-ble-plx"
import BluetoothPermissions from "@/components/bluetoothPermissions"
import {
  Climbro,
  Entralpi,
  ForceBoard,
  Motherboard,
  mySmartBoard,
  Progressor,
  WHC06,
} from "@hangtime/grip-connect-react-native"
import { Platform } from "react-native"
import { DeviceType } from "@/components/DevicePicker"

let bleManager: BleManager | null = null
let device: WHC06 | Climbro | Entralpi | ForceBoard | Motherboard | mySmartBoard | Progressor | null = null

if (Platform.OS !== "web") {
  bleManager = new BleManager()
}

const { requestPermissions } = BluetoothPermissions()

const createDevice = (deviceType: DeviceType) => {
  switch (deviceType) {
    case "whc06":
      return new WHC06()
    case "climbro":
      return new Climbro()
    case "entralpi":
      return new Entralpi()
    case "forceboard":
      return new ForceBoard()
    case "motherboard":
      return new Motherboard()
    case "mysmartboard":
      return new mySmartBoard()
    case "progressor":
      return new Progressor()
    default:
      return null
  }
}

export const scanForScale = async (
  deviceType: DeviceType,
  setNewWeight: (weight: number) => void,
  setError: (error: string | undefined) => void,
) => {
  const isPermissionsEnabled = await requestPermissions()
  if (!isPermissionsEnabled) {
    setError("Permissions not granted")
    return
  }

  const state = await bleManager?.state()
  if (state !== "PoweredOn") {
    setError("Bluetooth is not enabled")
    const subscription = bleManager?.onStateChange((newState) => {
      if (newState === "PoweredOn") {
        startScan(deviceType, setNewWeight, setError)
        setError(undefined)
        subscription?.remove()
      }
    }, true)
    return
  }

  startScan(deviceType, setNewWeight, setError)
}

const startScan = async (
  deviceType: DeviceType,
  setNewWeight: (weight: number) => void,
  setError: (error: string | undefined) => void,
) => {
  try {
    device = createDevice(deviceType)
    if (!device) {
      setError("Invalid device type")
      return
    }

    device.notify((data) => {
      setNewWeight(Number(data.massTotal))
    })

    await device.connect(
      () => {
        if (device && "stream" in device) {
          device.stream()
        }
      },
      (error) => {
        setError("Failed to connect to device")
        console.error(error)
        return
      },
    )
  } catch (err) {
    setError("An error occurred while scanning")
    console.error(err)
  }
}

export const stopScan = () => {
  bleManager?.stopDeviceScan()
  device?.disconnect()
  device = null
}
