import type { Action, CliDevice, RunOptions } from "../../types.js"
import { runPlaceholderSession } from "./shared.js"

export function buildRepeatersAction(): Action {
  return {
    name: "Repeaters",
    description: "Design a custom workout consisting of sets and repetitions.",
    disabled: true,
    run: async (device: CliDevice, options: RunOptions) =>
      runPlaceholderSession(
        "Repeaters",
        "Design a custom workout consisting of sets and repetitions.\n",
        device,
        options,
      ),
  }
}
