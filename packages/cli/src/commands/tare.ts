/**
 * `grip-connect tare [device]` -- runs tare (zero) calibration.
 */

import type { Command } from "commander"
import ora from "ora"
import { resolveDeviceKey, createDevice, connectAndRun, resolveContext, fail } from "../utils.js"

/**
 * Registers the `tare` command on the Commander program.
 *
 * @param program - The root Commander program.
 */
export function registerTare(program: Command): void {
  program
    .command("tare [device]")
    .description("Connect and run tare (zero) calibration")
    .option("-d, --duration <ms>", "Tare duration in milliseconds", "5000")
    .action(async (deviceKey: string | undefined, options: { duration: string }) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)
      const duration = parseInt(options.duration, 10)

      await connectAndRun(
        device,
        name,
        async (d) => {
          if (typeof d.tare !== "function") {
            fail("Tare not supported on this device.")
          }
          const started = d.tare(duration)
          if (!started) {
            fail("Tare could not be started (already active?).")
          }

          const spinner = ctx.json ? null : ora(`Tare calibration (${duration / 1000}s). Keep device still...`).start()
          await new Promise((r) => setTimeout(r, duration))
          spinner?.succeed("Tare calibration complete.")
        },
        ctx,
      )
    })
}
