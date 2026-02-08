/**
 * `grip-connect active [device]` -- monitors device activity status.
 *
 * Uses the core `active()` callback to detect when force exceeds a
 * threshold for a given duration, printing status changes with timestamps.
 */

import type { Command } from "commander"
import pc from "picocolors"
import {
  resolveDeviceKey,
  createDevice,
  resolveContext,
  outputJson,
  printHeader,
  setupSignalHandlers,
  waitForKeyToStop,
  fail,
} from "../utils.js"
import ora from "ora"

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
      const threshold = parseFloat(options.threshold)
      const duration = parseInt(options.duration, 10)

      const spinner = ctx.json ? null : ora(`Connecting to ${pc.bold(name)}...`).start()

      try {
        await device.connect(async () => {
          spinner?.succeed(`Connected to ${pc.bold(name)}`)

          if (typeof device.active !== "function") {
            device.disconnect()
            fail("Activity monitoring not supported on this device.")
          }

          setupSignalHandlers(device)

          device.active(
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
          device.disconnect()
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        spinner?.fail(`Connection failed: ${message}`)
        fail(`Connection to ${name} failed: ${message}`)
      }
    })
}
