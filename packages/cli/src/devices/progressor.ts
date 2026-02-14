/**
 * Device definition for the Tindeq Progressor.
 */

import input from "@inquirer/input"
import { Progressor } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"
import { fail, printResult } from "../utils.js"

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
      description: "Get calibration curve — 3× float32",
      run: async (device) => {
        const d = device as unknown as Progressor
        printResult("Calibration:", await d.calibration())
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
      name: "Reset calibration",
      description: "Reset calibration to default values (Dangerous!)",
      run: async (device) => {
        const d = device as unknown as Progressor
        await d.resetCalibration()
        printResult("Reset calibration:", "sent")
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
      name: "Tare scale",
      description: "Hardware tare — zero the scale",
      run: async (device) => {
        const d = device as unknown as Progressor
        await d.tareScale()
        printResult("Tare scale:", "sent")
      },
    },
    {
      name: "Re-calibrate",
      description: "Two-point calibration (Dangerous!)",
      run: async (device, opts) => {
        const d = device as unknown as Progressor
        let refWeightKg = opts.refWeightKg

        if (opts.ctx?.json && refWeightKg == null) {
          fail("Re-calibrate requires --ref-weight-kg in JSON mode")
        }

        if (typeof d.stop === "function") {
          await d.stop()
          await new Promise((r) => setTimeout(r, 500))
        }

        if (refWeightKg == null) {
          await input({
            message: "Ensure NO load on the Progressor. Press Enter to add zero point.",
            default: "",
          })
        }

        await d.addCalibrationPoint(0)
        await new Promise((r) => setTimeout(r, 1500))

        if (refWeightKg == null) {
          const raw = await input({
            message: "Place known weight on device. Enter weight in kg (e.g. 5 or 10):",
            default: "5",
          })
          refWeightKg = parseFloat(raw.trim() || "5")
        }

        if (refWeightKg <= 0 || !Number.isFinite(refWeightKg)) {
          fail("Weight must be a positive number (e.g. 5 for 5 kg)")
        }

        await d.addCalibrationPoint(refWeightKg)
        await new Promise((r) => setTimeout(r, 1500))
        await d.saveCalibration()
        printResult("Re-calibration:", `complete. Try streaming to verify.`)
      },
    },
  ],
}

export default progressor
