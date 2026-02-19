import type { Action, CliDevice, RunOptions } from "../../types.js"
import { pickAction } from "../../utils.js"

export function buildErrorsSettingsAction(errorSubactions: Action[]): Action {
  return {
    name: "Errors",
    description: "Get or clear error information",
    run: async (currentDevice: CliDevice, options: RunOptions) => {
      const sub = await pickAction(errorSubactions)
      await sub.run(currentDevice, options)
    },
  }
}
