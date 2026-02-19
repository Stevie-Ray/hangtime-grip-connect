import { runGuidedTareCalibration } from "../../services/session.js"
import type { Action, CliDevice, RunOptions } from "../../types.js"

/** Manual tare inside Settings. Always runs when selected. */
export function buildTareSettingsAction(device: CliDevice): Action | undefined {
  if (typeof device.tare !== "function") return undefined

  return {
    name: "Tare",
    description: "Zero offset reset",
    run: async (currentDevice: CliDevice, options: RunOptions) => {
      await runGuidedTareCalibration(currentDevice, 1000, options.ctx ?? { json: false, unit: "kg" })
      if (options.sessionState) {
        options.sessionState.isTared = true
      }
    },
  }
}
