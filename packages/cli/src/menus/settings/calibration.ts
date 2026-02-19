import type { Action, CliDevice, RunOptions } from "../../types.js"
import { pickAction } from "../../utils.js"

export function buildCalibrationSettingsAction(calibrationSubactions: Action[]): Action {
  return {
    name: "Calibration",
    description: "Get curve, set curve, or add calibration points",
    run: async (currentDevice: CliDevice, options: RunOptions) => {
      const sub = await pickAction(calibrationSubactions)
      await sub.run(currentDevice, options)
    },
  }
}
