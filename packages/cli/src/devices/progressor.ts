/**
 * Device definition for the Tindeq Progressor.
 */

import { Progressor } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"
import { printResult } from "../utils.js"

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
      description: "Get calibration curve (0x72) — 3× float32",
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
  ],
}

export default progressor
