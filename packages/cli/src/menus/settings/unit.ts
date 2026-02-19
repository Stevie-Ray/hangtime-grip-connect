import select from "@inquirer/select"
import pc from "picocolors"
import type { Action, CliDevice, ForceUnit, RunOptions } from "../../types.js"

export function buildUnitSettingsAction(currentUnit: ForceUnit): Action {
  return {
    name: `Unit (${currentUnit})`,
    description: "Set stream output to kilogram, pound, or newton",
    run: async (_device: CliDevice, options: RunOptions) => {
      const unit = await select({
        message: "Unit:",
        choices: [
          { name: "Kilogram", value: "kg" as const },
          { name: "Pound", value: "lbs" as const },
          { name: "Newton", value: "n" as const },
        ],
      })
      if (options.ctx) options.ctx.unit = unit
      if (!options.ctx?.json) console.log(pc.dim(`Force output: ${unit}`))
    },
  }
}
