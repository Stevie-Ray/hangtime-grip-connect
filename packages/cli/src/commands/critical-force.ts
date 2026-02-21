import type { Command } from "commander"
import { runCriticalForceAction } from "../menus/stream-actions/critical-force.js"
import { connectAndRun, createDevice, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

interface CriticalForceCliOptions {
  countdown?: string
}

/**
 * Registers the `critical-force` command.
 */
export function registerCriticalForce(program: Command): void {
  program
    .command("critical-force [device]")
    .alias("critical")
    .alias("crictal-force")
    .description("Run the 24x (7s pull / 3s rest) critical force test")
    .option("--countdown <seconds>", "Countdown before protocol starts", "3")
    .action(async (deviceKey: string | undefined, options: CriticalForceCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)
      const countdownSeconds = Number.isFinite(Number(options.countdown)) ? Math.max(0, Number(options.countdown)) : 3

      if (!ctx.json) {
        printHeader(`Critical Force – ${name}`)
      }

      await connectAndRun(
        device,
        name,
        async (d) =>
          runCriticalForceAction(d, {
            ctx,
            nonInteractive: true,
            session: { criticalForce: { countdownSeconds } },
          }),
        ctx,
        {
          setupDefaultNotify: false,
        },
      )
    })
}
