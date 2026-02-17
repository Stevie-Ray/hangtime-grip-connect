import type { Command } from "commander"
import pc from "picocolors"
import { resolveDeviceKey, createDevice, connectAndRun, resolveContext, printHeader } from "../utils.js"
import { parseDurationSeconds } from "../parsers.js"
import { runLiveDataSession } from "../services/session.js"

/**
 * Registers the `live` command (alias: `stream`) on the Commander program.
 *
 * @param program - The root Commander program.
 */
export function registerStream(program: Command): void {
  program
    .command("live [device]")
    .alias("stream")
    .description("Live Data: just the raw data visualised in real-time (Esc to stop, or use -d for a fixed duration)")
    .option("-d, --duration <seconds>", "Run for this many seconds (omit to run until Esc)")
    .action(async (deviceKey: string | undefined, options: { duration?: string }) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)
      const durationMs = parseDurationSeconds(options.duration)
      const indefinite = durationMs == null || durationMs === 0

      if (!ctx.json) {
        if (indefinite) {
          printHeader(`Live Data – ${name}`)
        } else {
          const ms = durationMs ?? 0
          printHeader(`Live Data – ${name} for ${ms / 1000}s`)
        }
      }

      await connectAndRun(device, name, async (d) => runLiveDataSession(d, ctx, { durationMs }), ctx, {
        setupDefaultNotify: false,
      })

      if (!ctx.json && !indefinite) {
        console.log(pc.dim("\nLive Data complete."))
      }
    })
}
