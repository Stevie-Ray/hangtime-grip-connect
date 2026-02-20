import type { Action, CliDevice, RunOptions } from "../../types.js"
import { promptIntegerSecondsOption, runPlaceholderSession } from "./shared.js"

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
        {
          onConfigureOptions: async () => {
            const countdownSeconds = await promptIntegerSecondsOption(
              "Countdown",
              options.session?.repeaters?.countdownSeconds ?? 3,
              0,
            )
            options.session = {
              ...(options.session ?? {}),
              repeaters: { ...(options.session?.repeaters ?? {}), countdownSeconds },
            }
          },
          getOptionsLabel: () => `Options (Countdown: ${options.session?.repeaters?.countdownSeconds ?? 3}s)`,
        },
        () => [`Countdown: ${options.session?.repeaters?.countdownSeconds ?? 3} seconds`],
      ),
  }
}
