import pc from "picocolors"
import { runRfdAction } from "../rfd.js"
import { runLiveDataSession } from "../services/session.js"
import type { Action, CliDevice, RunOptions } from "../types.js"
import { pickAction } from "../utils.js"

/** Placeholder flow used by tests that are not implemented yet. */
const MODE_SUBACTIONS: Action[] = [
  {
    name: "Start session",
    description: "Begin the test",
    disabled: true,
    run: async () => {
      return
    },
  },
  {
    name: "Return",
    description: "Go back to main menu",
    run: async () => {
      return
    },
  },
]

async function runPlaceholderSession(
  title: string,
  body: string,
  device: CliDevice,
  options: RunOptions,
): Promise<void> {
  if (options.ctx?.json) return

  console.log(pc.cyan(`\n${title}\n`) + pc.dim("─".repeat(60) + "\n") + body)
  const sub = await pickAction(MODE_SUBACTIONS, "Next:")
  await sub.run(device, options)
}

/** Builds stream-related actions shown for devices that support `stream()`. */
export function buildStreamActions(): Action[] {
  return [
    {
      name: "Live Data",
      description: "Just the raw data visualised in real-time",
      run: async (device: CliDevice, options: RunOptions) => {
        const duration = options.duration
        const indefinite = duration == null || duration === 0
        const outCtx = options.ctx ?? { json: false, unit: "kg" }

        if (!outCtx.json) {
          console.log(
            pc.cyan(indefinite ? "\nLive Data...\n" : `\nLive Data for ${(duration ?? 0) / 1000} seconds...\n`),
          )
        }

        await runLiveDataSession(device, outCtx, {
          durationMs: duration,
          askDownload: true,
          format: options.format,
        })
      },
    },
    {
      name: "Peak Force / MVC",
      description: "Record maximal voluntary contractions (MVC), asymmetry.",
      disabled: true,
      run: async (device: CliDevice, options: RunOptions) =>
        runPlaceholderSession(
          "Peak Force / MVC",
          "Use this test to measure the peak force (maximum voluntary contraction, MVC) of a muscle. " +
            "Choose Single or Left/Right to record one side or both. " +
            "You can also enable torque and body weight calculations to get more detailed insights into your strength measurements.\n",
          device,
          options,
        ),
    },
    {
      name: "Endurance",
      description: "Record data for a given duration.",
      disabled: true,
      run: async (device: CliDevice, options: RunOptions) =>
        runPlaceholderSession("Endurance", "Record data for a given duration.\n", device, options),
    },
    {
      name: "RFD",
      description: "Record and calculate Rate of Force Development or explosive strength.",
      run: async (device: CliDevice, options: RunOptions) => runRfdAction(device, options),
    },
    {
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
    },
    {
      name: "Critical Force",
      description: "Determine your sustainable maximum force with repeated pulls.",
      disabled: true,
      run: async (device: CliDevice, options: RunOptions) =>
        runPlaceholderSession(
          "Critical Force",
          "In this test we utilize the methodology outlined in the scientific paper titled " +
            pc.italic("An All-Out Test to Determine Finger Flexor Critical Force in Rock Climbers") +
            " to measure critical force. " +
            "The objective is to determine the force level you can sustain over a long period without fatigue, " +
            "which is done by performing a series of 'pulls' until the force output flattens out and reaches a plateau.\n\n" +
            "To identify it, you'll execute up to " +
            pc.bold("24 'pulls'") +
            ", each lasting for " +
            pc.bold("7 seconds") +
            " where you are pulling as hard as possible. " +
            "This is followed by a " +
            pc.bold("3 second") +
            " break. " +
            "If you reach the plateau before 24 reps, you have the option to cancel and save.\n",
          device,
          options,
        ),
    },
  ]
}
