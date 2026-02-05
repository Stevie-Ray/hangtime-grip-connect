/**
 * `grip-connect stream [device]` -- streams force data for a set duration.
 */

import type { Command } from "commander"
import pc from "picocolors"
import { resolveDeviceKey, createDevice, connectAndRun, resolveContext, setupNotify, printHeader } from "../utils.js"

/**
 * Registers the `stream` command on the Commander program.
 *
 * @param program - The root Commander program.
 */
export function registerStream(program: Command): void {
  program
    .command("stream [device]")
    .description("Connect to a device and stream force data")
    .option("-d, --duration <ms>", "Stream duration in milliseconds", "10000")
    .option("-w, --watch", "Stream indefinitely until Ctrl+C")
    .action(async (deviceKey: string | undefined, options: { duration: string; watch?: boolean }) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)
      const duration = options.watch ? 0 : parseInt(options.duration, 10)

      if (!ctx.json) {
        if (options.watch) {
          printHeader(`Streaming ${name} (Ctrl+C to stop)`)
        } else {
          printHeader(`Streaming ${name} for ${duration / 1000}s`)
        }
      }

      await connectAndRun(
        device,
        name,
        async (d) => {
          if (typeof d.stream !== "function") {
            throw new Error("Stream not supported on this device.")
          }
          setupNotify(d, ctx)
          await d.stream(duration)
          await d.stop?.()

          if (!ctx.json && !options.watch) {
            console.log(pc.dim("\nStream complete."))
          }
        },
        ctx,
      )
    })
}
