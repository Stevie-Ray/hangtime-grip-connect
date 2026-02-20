import type { Action, CliDevice, RunOptions } from "../../types.js"
import { promptIntegerSecondsOption, runPlaceholderSession } from "./shared.js"

export function buildEnduranceAction(): Action {
  return {
    name: "Endurance",
    description: "Record data for a given duration.",
    disabled: true,
    run: async (device: CliDevice, options: RunOptions) =>
      runPlaceholderSession(
        "Endurance",
        "Record data for a given duration.\n",
        device,
        options,
        {
          onConfigureOptions: async () => {
            const durationSeconds = await promptIntegerSecondsOption(
              "Duration",
              options.session?.endurance?.durationSeconds ?? 30,
              1,
            )
            const countdownSeconds = await promptIntegerSecondsOption(
              "Countdown",
              options.session?.endurance?.countdownSeconds ?? 3,
              0,
            )
            options.session = {
              ...(options.session ?? {}),
              endurance: { ...(options.session?.endurance ?? {}), durationSeconds, countdownSeconds },
            }
          },
          getOptionsLabel: () =>
            `Options (Duration: ${options.session?.endurance?.durationSeconds ?? 30}s, Countdown: ${
              options.session?.endurance?.countdownSeconds ?? 3
            }s)`,
        },
        () => [
          `Duration: ${options.session?.endurance?.durationSeconds ?? 30} seconds`,
          `Countdown: ${options.session?.endurance?.countdownSeconds ?? 3} seconds`,
        ],
      ),
  }
}
