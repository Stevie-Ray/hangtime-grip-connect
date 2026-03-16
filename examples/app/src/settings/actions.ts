import type { ConnectedDevice } from "../devices/session.js"
import { setActiveDevice } from "../devices/session.js"
import { loadNordicDfuPackage } from "./nordic-dfu-package.js"

export type SettingsActionId =
  | "tare"
  | "system-info"
  | "calibration-read"
  | "calibration-set"
  | "calibration-add-point"
  | "calibration-save"
  | "errors-read"
  | "errors-clear"
  | "firmware-upload"

interface RunSettingsActionOptions {
  action: SettingsActionId
  appElement: HTMLDivElement
  device: ConnectedDevice | null
  setFeedback: (status: string, output?: string) => void
  onTareStarted?: () => void
}

function parseCalibrationCurveInput(raw: string): Uint8Array | null {
  const trimmed = raw.trim()
  if (!trimmed) return new Uint8Array(0)
  const tokens = trimmed.split(/[\s,]+/).filter((token) => token.length > 0)
  if (tokens.length !== 12) return null
  const bytes = tokens.map((token) => {
    const parsed = Number.parseInt(token.replace(/^0x/i, ""), 16)
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 255 ? parsed : NaN
  })
  if (bytes.some((value) => Number.isNaN(value))) return null
  return new Uint8Array(bytes)
}

function formatDeviceDisplayName(device: ConnectedDevice): string {
  const ctorName = (device as { constructor?: { name?: string } }).constructor?.name?.trim()
  if (!ctorName) return "Unknown Device"
  return ctorName.replace(/([a-z0-9])([A-Z])/g, "$1 $2")
}

async function readSystemInfo(device: ConnectedDevice): Promise<string> {
  interface CommandDef {
    key: string
    signature: string
    kind: "read" | "control"
    description: string
    label: string
    read: (deviceRef: ConnectedDevice) => Promise<unknown>
  }

  const commands: CommandDef[] = [
    {
      key: "battery",
      signature: "battery()",
      kind: "read",
      description: "Battery/voltage.",
      label: "Battery",
      read: async (deviceRef) => (typeof deviceRef.battery === "function" ? deviceRef.battery() : undefined),
    },
    {
      key: "firmware",
      signature: "firmware()",
      kind: "read",
      description: "Firmware version.",
      label: "Version",
      read: async (deviceRef) => (typeof deviceRef.firmware === "function" ? deviceRef.firmware() : undefined),
    },
    {
      key: "certification",
      signature: "certification()",
      kind: "read",
      description: "IEEE 11073-20601 regulatory certification.",
      label: "Certification",
      read: async (deviceRef) => {
        const maybe = deviceRef as { certification?: () => Promise<unknown> | unknown }
        return typeof maybe.certification === "function" ? maybe.certification() : undefined
      },
    },
    {
      key: "hardware",
      signature: "hardware()",
      kind: "read",
      description: "Hardware version.",
      label: "Hardware",
      read: async (deviceRef) => {
        const maybe = deviceRef as { hardware?: () => Promise<unknown> | unknown }
        return typeof maybe.hardware === "function" ? maybe.hardware() : undefined
      },
    },
    {
      key: "manufacturer",
      signature: "manufacturer()",
      kind: "read",
      description: "Manufacturer info.",
      label: "Manufacturer",
      read: async (deviceRef) => {
        const maybe = deviceRef as { manufacturer?: () => Promise<unknown> | unknown }
        return typeof maybe.manufacturer === "function" ? maybe.manufacturer() : undefined
      },
    },
    {
      key: "model",
      signature: "model()",
      kind: "read",
      description: "Model number.",
      label: "Model",
      read: async (deviceRef) => {
        const maybe = deviceRef as { model?: () => Promise<unknown> | unknown }
        return typeof maybe.model === "function" ? maybe.model() : undefined
      },
    },
    {
      key: "pnp",
      signature: "pnp()",
      kind: "read",
      description: "PnP ID.",
      label: "PnP",
      read: async (deviceRef) => {
        const maybe = deviceRef as { pnp?: () => Promise<unknown> | unknown }
        return typeof maybe.pnp === "function" ? maybe.pnp() : undefined
      },
    },
    {
      key: "software",
      signature: "software()",
      kind: "read",
      description: "Software version.",
      label: "Software",
      read: async (deviceRef) => {
        const maybe = deviceRef as { software?: () => Promise<unknown> | unknown }
        return typeof maybe.software === "function" ? maybe.software() : undefined
      },
    },
    {
      key: "system",
      signature: "system()",
      kind: "read",
      description: "System ID.",
      label: "System",
      read: async (deviceRef) => {
        const maybe = deviceRef as { system?: () => Promise<unknown> | unknown }
        return typeof maybe.system === "function" ? maybe.system() : undefined
      },
    },
    {
      key: "humidity",
      signature: "humidity()",
      kind: "read",
      description: "Humidity level.",
      label: "Humidity",
      read: async (deviceRef) => {
        const maybe = deviceRef as { humidity?: () => Promise<unknown> | unknown }
        return typeof maybe.humidity === "function" ? maybe.humidity() : undefined
      },
    },
    {
      key: "temperature",
      signature: "temperature()",
      kind: "read",
      description: "Temperature.",
      label: "Temperature",
      read: async (deviceRef) => {
        const maybe = deviceRef as { temperature?: () => Promise<unknown> | unknown }
        return typeof maybe.temperature === "function" ? maybe.temperature() : undefined
      },
    },
    {
      key: "calibration",
      signature: "calibration()",
      kind: "read",
      description: "Calibration payload.",
      label: "Calibration",
      read: async (deviceRef) => (typeof deviceRef.calibration === "function" ? deviceRef.calibration() : undefined),
    },
    {
      key: "errorInfo",
      signature: "errorInfo()",
      kind: "read",
      description: "Device error details.",
      label: "Error Info",
      read: async (deviceRef) => (typeof deviceRef.errorInfo === "function" ? deviceRef.errorInfo() : undefined),
    },
    {
      key: "stop",
      signature: "stop()",
      kind: "control",
      description: "Stop stream (Idle mode).",
      label: "Stop",
      read: async () => undefined,
    },
    {
      key: "stream",
      signature: "stream(duration?)",
      kind: "control",
      description: "Start stream. Duration in ms; 0/omit for continuous.",
      label: "Stream",
      read: async () => undefined,
    },
    {
      key: "tareByCharacteristic",
      signature: "tareByCharacteristic()",
      kind: "control",
      description: "Tare via characteristic.",
      label: "Tare By Characteristic",
      read: async () => undefined,
    },
    {
      key: "tareByMode",
      signature: "tareByMode()",
      kind: "control",
      description: "Tare via Device Mode.",
      label: "Tare By Mode",
      read: async () => undefined,
    },
    {
      key: "threshold",
      signature: "threshold(thresholdLbs)",
      kind: "control",
      description: "Set Quick Start threshold (lbs).",
      label: "Threshold",
      read: async () => undefined,
    },
    {
      key: "quick",
      signature: "quick(duration?)",
      kind: "control",
      description: "Start Quick Start mode. Duration in ms; 0/omit for indefinite.",
      label: "Quick",
      read: async () => undefined,
    },
  ]

  const deviceRecord = device as unknown as Record<string, unknown>
  const available = commands.filter((command) => typeof deviceRecord[command.key] === "function")
  const availableRead = available.filter((command) => command.kind === "read")

  const header = `${formatDeviceDisplayName(device)} Info`

  const values = await Promise.all(
    availableRead.map(async (command) => {
      try {
        const value = await command.read(device)
        if (value == null || value === "") return `${command.label}: Unavailable`
        if (typeof value === "object") return `${command.label}: ${JSON.stringify(value)}`
        return `${command.label}: ${String(value)}`
      } catch (error: unknown) {
        return `${command.label}: ${error instanceof Error ? error.message : "Read failed"}`
      }
    }),
  )

  return `${header}\n\n${values.join("\n")}`
}

export async function runSettingsAction(options: RunSettingsActionOptions): Promise<void> {
  const { action, appElement, device, setFeedback, onTareStarted } = options
  if (!device) {
    setFeedback("No connected device.")
    return
  }

  try {
    if (action === "tare") {
      if (!device.tare) {
        setFeedback("Tare is not supported by this device.")
        return
      }
      const started = device.tare(1000)
      setFeedback(started ? "Tare started." : "Tare did not start.")
      if (started) onTareStarted?.()
      return
    }

    if (action === "system-info") {
      const output = await readSystemInfo(device)
      setFeedback("", output)
      return
    }

    if (action === "calibration-read") {
      if (!device.calibration) {
        setFeedback("Calibration is not supported by this device.")
        return
      }
      const calibration = await device.calibration()
      setFeedback("Calibration loaded.", calibration == null ? "No calibration payload returned." : String(calibration))
      return
    }

    if (action === "calibration-set") {
      if (!device.setCalibration) {
        setFeedback("Setting calibration is not supported by this device.")
        return
      }
      const input = appElement.querySelector<HTMLInputElement>("[data-settings-calibration-input]")
      const curve = parseCalibrationCurveInput(input?.value ?? "")
      if (!curve) {
        setFeedback("Invalid curve. Provide 12 hex bytes separated by spaces or commas.")
        return
      }
      await device.setCalibration(curve)
      setFeedback(curve.length === 0 ? "Calibration reset." : "Calibration curve updated.")
      return
    }

    if (action === "calibration-add-point") {
      if (!device.addCalibrationPoint) {
        setFeedback("Add calibration point is not supported by this device.")
        return
      }
      await device.addCalibrationPoint()
      setFeedback("Calibration point captured.")
      return
    }

    if (action === "calibration-save") {
      if (!device.saveCalibration) {
        setFeedback("Save calibration is not supported by this device.")
        return
      }
      await device.saveCalibration()
      setFeedback("Calibration saved.")
      return
    }

    if (action === "errors-read") {
      if (!device.errorInfo) {
        setFeedback("Error info is not supported by this device.")
        return
      }
      const info = await device.errorInfo()
      setFeedback("Error info loaded.", info ?? "No error details returned.")
      return
    }

    if (action === "errors-clear") {
      if (!device.clearErrorInfo) {
        setFeedback("Clear errors is not supported by this device.")
        return
      }
      await device.clearErrorInfo()
      setFeedback("Errors cleared.")
      return
    }

    if (action === "firmware-upload") {
      if (!device.dfuUpload) {
        setFeedback("Firmware update is not supported by this device.")
        return
      }

      const input = appElement.querySelector<HTMLInputElement>("[data-settings-firmware-file]")
      const file = input?.files?.[0]
      if (!file) {
        setFeedback("Choose a Nordic DFU .zip package first.")
        return
      }

      const dfuPackage = await loadNordicDfuPackage(file)
      setFeedback(
        `Uploading ${dfuPackage.image.type} firmware...`,
        `${dfuPackage.packageName}\n${dfuPackage.image.imageFile}\n${dfuPackage.image.initFile}`,
      )

      await device.dfuUpload(dfuPackage.image.initData, dfuPackage.image.imageData)
      setActiveDevice(null)
      if (input) input.value = ""

      setFeedback(
        "Firmware update complete. Reconnect the device to continue.",
        `${dfuPackage.packageName}\n${dfuPackage.image.imageFile}\n${dfuPackage.image.initFile}`,
      )
    }
  } catch (error: unknown) {
    if (
      action === "firmware-upload" &&
      error instanceof Error &&
      error.message.startsWith("Device entered DFU mode.")
    ) {
      setActiveDevice(null)
      setFeedback(
        error.message,
        "Choose the Nordic DFU bootloader in the browser picker, then press Upload Firmware again.",
      )
      return
    }

    setFeedback(error instanceof Error ? error.message : "Settings action failed.")
  }
}
