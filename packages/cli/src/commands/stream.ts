/**
 * `grip-connect stream [device]` -- streams force data until Esc (or for a set duration if -d is given).
 */

import type { Command } from "commander"
import pc from "picocolors"
import {
  resolveDeviceKey,
  createDevice,
  connectAndRun,
  resolveContext,
  setupNotify,
  printHeader,
  waitForKeyToStop,
} from "../utils.js"

/**
 * Registers the `stream` command on the Commander program.
 *
 * @param program - The root Commander program.
 */
export function registerStream(program: Command): void {
  program
    .command("stream [device]")
    .description("Connect to a device and stream force data (Esc to stop, or use -d for a fixed duration)")
    .option("-d, --duration <seconds>", "Stream for this many seconds (omit to stream until Esc)")
    .action(async (deviceKey: string | undefined, options: { duration?: string }) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)
      const durationSec = options.duration != null ? parseFloat(options.duration) : undefined
      const durationMs = durationSec != null && !Number.isNaN(durationSec) ? Math.round(durationSec * 1000) : undefined
      const indefinite = durationMs == null || durationMs === 0

      if (!ctx.json) {
        if (indefinite) {
          printHeader(`Streaming ${name}`)
        } else {
          const ms = durationMs ?? 0
          printHeader(`Streaming ${name} for ${ms / 1000}s`)
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
          if (indefinite) {
            await d.stream()
            await waitForKeyToStop(ctx.json ? undefined : "Press Esc to stop streaming")
            await d.stop?.()
          } else {
            await d.stream(durationMs)
            await d.stop?.()
          }

          if (!ctx.json && !indefinite) {
            console.log(pc.dim("\nStream complete."))
          }
        },
        ctx,
      )
    })
}
