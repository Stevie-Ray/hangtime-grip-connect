/**
 * Device definition for the Tindeq Progressor.
 */

import input from "@inquirer/input"
import { Progressor } from "@hangtime/grip-connect-runtime"
import type { Action, DeviceDefinition, CliDevice } from "../types.js"
import { fail, pickAction, printResult } from "../utils.js"

/** Helper to parse 12 hex bytes into Uint8Array for setCalibration. */
function parseCurveHex(s: string): Uint8Array {
  const hex = s.replace(/\s+/g, "").toLowerCase()
  if (hex.length !== 24 || !/^[0-9a-f]+$/.test(hex)) {
    fail("Expected 12 hex bytes (24 hex chars). E.g. 24 1d 00 20 87 05 01 00 16 db 15 a9")
  }
  const bytes = new Uint8Array(12)
  for (let i = 0; i < 12; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16)
  }
  return bytes
}

const calibrationSubactions: Action[] = [
  {
    name: "Get Current Calibration Curve",
    description: "Read calibration curve",
    run: async (device) => {
      const d = device as unknown as Progressor
      printResult("Calibration:", await d.calibration())
    },
  },
  {
    name: "Set Calibration Curve",
    description: "Expert only. Raw overwrite, restore from backup / clone. ",
    nameColor: "yellow",
    run: async (device, opts) => {
      const d = device as unknown as Progressor
      printResult("Current calibration curve:", await d.calibration())

      let curve = opts?.setCalibrationCurve

      if (!curve && opts?.ctx?.json) {
        fail("Set calibration requires --set-calibration-curve in JSON mode")
      }

      if (!curve) {
        const raw = await input({
          message: "Paste 12-byte curve (hex, e.g. FF FF FF FF FF FF FF FF 00 00 00 00):",
          default: "",
        })
        curve = raw?.trim() ?? ""
      } else {
        curve = String(curve).trim()
      }

      const bytes = curve ? parseCurveHex(curve) : new Uint8Array(0)
      await d.setCalibration(bytes)
      printResult("Set calibration:", bytes.length === 0 ? "No curve provided, calibration reset" : "sent")
      printResult("Calibration after set:", await d.calibration())
    },
  },
  {
    name: "Add Calibration point",
    description: "Expert only. Capture current load as calibration point.",
    nameColor: "yellow",
    run: async (device, opts) => {
      const d = device as unknown as Progressor

      if (typeof d.stop === "function") {
        await d.stop()
        await new Promise((r) => setTimeout(r, 500))
      }

      printResult("Calibration before:", await d.calibration())

      await input({
        message:
          "Ensure correct load on device (no load for zero, or known weight for reference). Press Enter to capture.",
        default: "",
      })

      await d.addCalibrationPoint()
      await new Promise((r) => setTimeout(r, 1500))
      printResult("Add calibration point:", "captured")
      printResult("Calibration after:", await d.calibration())

      let shouldSave = opts?.saveCalibration
      if (shouldSave == null && !opts?.ctx?.json) {
        const raw = await input({
          message: "Save calibration now? (Requires zero + reference points first.) [y/N]:",
          default: "n",
        })
        shouldSave = /^y(es)?$/i.test(raw?.trim() ?? "")
      }

      if (shouldSave) {
        await d.saveCalibration()
        printResult("Save calibration:", "complete. Try streaming to verify.")
      }
    },
  },
]

const progressor: DeviceDefinition = {
  name: "Progressor",
  class: Progressor as unknown as new () => CliDevice,
  actions: [
    {
      name: "Battery",
      description: "Read battery level",
      run: async (device) => {
        const d = device as unknown as Progressor
        printResult("Battery:", await d.battery())
      },
    },
    {
      name: "Firmware",
      description: "Read firmware version",
      run: async (device) => {
        const d = device as unknown as Progressor
        printResult("Firmware:", await d.firmware())
      },
    },
    {
      name: "Progressor ID",
      description: "Get Progressor ID",
      run: async (device) => {
        const d = device as unknown as Progressor
        printResult("Progressor ID:", await d.progressorId())
      },
    },
    {
      name: "Calibration",
      description: "Get curve, set curve, or add calibration points",
      subactions: calibrationSubactions,
      run: async (device, opts) => {
        const sub = await pickAction(calibrationSubactions)
        await sub.run(device, opts)
      },
    },
    {
      name: "Error info",
      description: "Get error information",
      run: async (device) => {
        const d = device as unknown as Progressor
        printResult("Error info:", await d.errorInfo())
      },
    },
    {
      name: "Clear error info",
      description: "Clear error information",
      run: async (device) => {
        const d = device as unknown as Progressor
        await d.clearErrorInfo()
        printResult("Clear error info:", "sent")
      },
    },
    {
      name: "Sleep",
      description: "Shutdown / sleep device",
      run: async (device) => {
        const d = device as unknown as Progressor
        await d.sleep()
        printResult("Sleep:", "sent")
      },
    },
    {
      name: "Tare",
      description: "Hardware zero offset reset",
      run: async (device) => {
        const d = device as unknown as Progressor
        await d.tareScale()
        printResult("Tare scale:", "sent")
      },
    },
  ],
}

export default progressor
