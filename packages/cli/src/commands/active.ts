/**
 * `grip-connect active [device]` -- monitors device activity status.
 *
 * Uses the core `active()` callback to detect when force exceeds a
 * threshold for a given duration, printing status changes with timestamps.
 */

import type { Command } from "commander"
import pc from "picocolors"
import { parseDurationMilliseconds, parseThreshold } from "../parsers.js"
import {
  resolveDeviceKey,
  createDevice,
  connectAndRun,
  resolveContext,
  outputJson,
  printHeader,
  waitForKeyToStop,
  fail,
} from "../utils.js"

/**
 * Registers the `active` command on the Commander program.
 *
 * @param program - The root Commander program.
 */
export function registerActive(program: Command): void {
  program
    .command("active [device]")
    .description("Monitor device activity (Esc to stop)")
    .option("-t, --threshold <kg>", "Force threshold in kg", "2.5")
    .option("-d, --duration <ms>", "Duration in ms to confirm activity", "1000")
    .action(async (deviceKey: string | undefined, options: { threshold: string; duration: string }) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)
      const threshold = parseThreshold(options.threshold)
      const duration = parseDurationMilliseconds(options.duration)

      await connectAndRun(
        device,
        name,
        async (d) => {
          if (typeof d.active !== "function") {
            fail("Activity monitoring not supported on this device.")
          }
          d.active(
            (isActive: boolean) => {
              const ts = new Date().toISOString()
              if (ctx.json) {
                outputJson({ timestamp: ts, active: isActive })
              } else {
                const status = isActive ? pc.green("ACTIVE") : pc.yellow("INACTIVE")
                console.log(`  ${pc.dim(ts)}  ${status}`)
              }
            },
            { threshold, duration },
          )

          if (!ctx.json) {
            printHeader(`Activity monitor for ${name}`)
            console.log(pc.dim(`  Threshold: ${threshold} kg  Duration: ${duration} ms\n`))
          }

          await waitForKeyToStop(ctx.json ? undefined : "Press Esc to stop")
        },
        ctx,
        { setupDefaultNotify: false },
      )
    })
}
