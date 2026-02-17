import { runTareCalibration } from "../services/session.js"
import type { Action, CliDevice } from "../types.js"

/** Builds tare action for devices that expose `tare()`. */
export function buildTareAction(device: CliDevice): Action | undefined {
  if (typeof device.tare !== "function") {
    return undefined
  }

  return {
    name: "Tare",
    description: "Zero offset reset (hardware or software)",
    run: async (currentDevice, options) => {
      await runTareCalibration(currentDevice, options.duration ?? 5000, options.ctx ?? { json: false, unit: "kg" })
    },
  }
}
