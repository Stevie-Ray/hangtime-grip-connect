import select from "@inquirer/select"
import type { Action, CliDevice, RunOptions } from "../../types.js"
import { runPlaceholderSession } from "./shared.js"

export function buildPeakForceMvcAction(): Action {
  return {
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
        {
          onConfigureOptions: async () => {
            const mode = await select({
              message: "Peak Force mode:",
              choices: [
                { name: "Single mode", value: "single" as const },
                { name: "Left/Right", value: "left-right" as const },
              ],
              default: options.session?.peakForce?.mode ?? "single",
            })
            options.session = {
              ...(options.session ?? {}),
              peakForce: { ...(options.session?.peakForce ?? {}), mode },
            }
          },
          getOptionsLabel: () =>
            `Options (Mode: ${(options.session?.peakForce?.mode ?? "single") === "single" ? "Single mode" : "Left/Right"})`,
        },
        () => [`Mode: ${(options.session?.peakForce?.mode ?? "single") === "single" ? "Single mode" : "Left/Right"}`],
      ),
  }
}
