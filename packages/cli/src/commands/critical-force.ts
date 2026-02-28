import type { Command } from "commander"
import { isDynamometerDeviceKey } from "../devices/capabilities.js"
import { runCriticalForceAction } from "../menus/stream-actions/critical-force.js"
import { parseCountdownSeconds } from "../parsers.js"
import { connectAndRun, createDevice, fail, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

interface CriticalForceCliOptions {
  countDownTime?: string
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
    .option("--count-down-time <time>", "Countdown before protocol starts (mm:ss or seconds)", "3")
    .action(async (deviceKey: string | undefined, options: CriticalForceCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      if (!isDynamometerDeviceKey(key)) {
        fail("This test is only available for dynamometers.")
      }
      const { device, name } = createDevice(key)
      const countDownTime = parseCountdownSeconds(options.countDownTime) ?? 3

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
            session: { criticalForce: { countDownTime } },
          }),
        ctx,
        {
          setupDefaultNotify: false,
        },
      )
    })
}
