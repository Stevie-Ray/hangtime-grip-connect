import type { Command } from "commander"
import pc from "picocolors"
import {
  resolveDeviceKey,
  createDevice,
  connectAndRun,
  resolveContext,
  printHeader,
  waitForKeyToStop,
  muteNotify,
  outputJson,
  formatMeasurement,
} from "../utils.js"
import { createChartRenderer } from "../chart.js"
import type { ForceMeasurement } from "../types.js"

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
      const durationSec = options.duration != null ? parseFloat(options.duration) : undefined
      const durationMs = durationSec != null && !Number.isNaN(durationSec) ? Math.round(durationSec * 1000) : undefined
      const indefinite = durationMs == null || durationMs === 0
      const chartEnabled = !ctx.json && process.stdout.isTTY
      const chart = createChartRenderer({ disabled: !chartEnabled, color: "cyan" })

      if (!ctx.json) {
        if (indefinite) {
          printHeader(`Live Data – ${name}`)
        } else {
          const ms = durationMs ?? 0
          printHeader(`Live Data – ${name} for ${ms / 1000}s`)
        }
      }

      await connectAndRun(
        device,
        name,
        async (d) => {
          if (typeof d.stream !== "function") {
            throw new Error("Live Data not supported on this device.")
          }
          d.notify((data: ForceMeasurement) => {
            if (ctx.json) {
              outputJson(data)
            } else if (chartEnabled) {
              chart.push(data.current)
            } else {
              console.log(formatMeasurement(data))
            }
          }, ctx.unit)
          if (chartEnabled) chart.start()
          if (indefinite) {
            await d.stream()
            await waitForKeyToStop(ctx.json ? undefined : "Press Esc to stop")
            const stopFn = d.stop
            if (typeof stopFn === "function") await stopFn()
          } else {
            await d.stream(durationMs)
            await d.stop?.()
          }
          if (chartEnabled) chart.stop()
          muteNotify(d)

          if (!ctx.json && !indefinite) {
            console.log(pc.dim("\nLive Data complete."))
          }
        },
        ctx,
      )
    })
}
