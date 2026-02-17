/**
 * `grip-connect tare [device]` -- runs tare (zero) calibration.
 */

import type { Command } from "commander"
import { parseDurationMilliseconds } from "../parsers.js"
import { runTareCalibration } from "../services/session.js"
import { resolveDeviceKey, createDevice, connectAndRun, resolveContext } from "../utils.js"

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
      const duration = parseDurationMilliseconds(options.duration)

      await connectAndRun(device, name, async (d) => runTareCalibration(d, duration, ctx), ctx, {
        setupDefaultNotify: false,
      })
    })
}
