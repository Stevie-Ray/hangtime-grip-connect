import type { Action, CliDevice, RunOptions } from "../../types.js"
import {
  promptIntegerSecondsOption,
  promptStreamActionOptionsMenu,
  runPlaceholderSession,
  viewSavedMeasurements,
} from "./shared.js"

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
            let durationSeconds = options.session?.endurance?.durationSeconds ?? 30
            let countdownSeconds = options.session?.endurance?.countdownSeconds ?? 3
            const openTimingSubmenu = async (): Promise<void> => {
              await promptStreamActionOptionsMenu("Endurance Timing", [
                {
                  label: () => `Duration: ${durationSeconds}s`,
                  run: async () => {
                    durationSeconds = await promptIntegerSecondsOption("Duration", durationSeconds, 1)
                    options.session = {
                      ...(options.session ?? {}),
                      endurance: { ...(options.session?.endurance ?? {}), durationSeconds, countdownSeconds },
                    }
                  },
                },
                {
                  label: () => `Countdown: ${countdownSeconds}s`,
                  run: async () => {
                    countdownSeconds = await promptIntegerSecondsOption("Countdown", countdownSeconds, 0)
                    options.session = {
                      ...(options.session ?? {}),
                      endurance: { ...(options.session?.endurance ?? {}), durationSeconds, countdownSeconds },
                    }
                  },
                },
              ])
            }

            await promptStreamActionOptionsMenu("Endurance", [
              {
                label: () => `Timing: ${durationSeconds}s duration, ${countdownSeconds}s countdown (open)`,
                run: openTimingSubmenu,
              },
            ])
          },
          getOptionsLabel: () =>
            `Options (Duration: ${options.session?.endurance?.durationSeconds ?? 30}s, Countdown: ${
              options.session?.endurance?.countdownSeconds ?? 3
            }s)`,
          onViewMeasurements: async () => viewSavedMeasurements("endurance", "Endurance"),
        },
        () => [
          `Duration: ${options.session?.endurance?.durationSeconds ?? 30} seconds`,
          `Countdown: ${options.session?.endurance?.countdownSeconds ?? 3} seconds`,
        ],
      ),
  }
}
