import type { Action, CliDevice, RunOptions } from "../../types.js"
import { runPlaceholderSession } from "./shared.js"

export function buildEnduranceAction(): Action {
  return {
    name: "Endurance",
    description: "Record data for a given duration.",
    disabled: true,
    run: async (device: CliDevice, options: RunOptions) =>
      runPlaceholderSession("Endurance", "Record data for a given duration.\n", device, options),
  }
}
