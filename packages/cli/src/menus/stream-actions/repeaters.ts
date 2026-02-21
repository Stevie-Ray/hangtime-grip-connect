import type { Action, CliDevice, RunOptions } from "../../types.js"
import {
  promptIntegerSecondsOption,
  promptStreamActionOptionsMenu,
  runPlaceholderSession,
  viewSavedMeasurements,
} from "./shared.js"

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
            let countdownSeconds = options.session?.repeaters?.countdownSeconds ?? 3
            const openTimingSubmenu = async (): Promise<void> => {
              await promptStreamActionOptionsMenu("Repeaters Timing", [
                {
                  label: () => `Countdown: ${countdownSeconds}s`,
                  run: async () => {
                    countdownSeconds = await promptIntegerSecondsOption("Countdown", countdownSeconds, 0)
                    options.session = {
                      ...(options.session ?? {}),
                      repeaters: { ...(options.session?.repeaters ?? {}), countdownSeconds },
                    }
                  },
                },
              ])
            }

            await promptStreamActionOptionsMenu("Repeaters", [
              {
                label: () => `Timing: Countdown ${countdownSeconds}s (open)`,
                run: openTimingSubmenu,
              },
            ])
          },
          getOptionsLabel: () => `Options (Countdown: ${options.session?.repeaters?.countdownSeconds ?? 3}s)`,
          onViewMeasurements: async () => viewSavedMeasurements("repeaters", "Repeaters"),
        },
        () => [`Countdown: ${options.session?.repeaters?.countdownSeconds ?? 3} seconds`],
      ),
  }
}
