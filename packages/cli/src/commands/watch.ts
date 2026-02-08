/**
 * `grip-connect watch [device]` -- streams force data indefinitely until
 * the user presses Esc.
 *
 * On exit, prints a summary of peak, mean, sample count, and elapsed time.
 */

import type { Command } from "commander"
import pc from "picocolors"
import type { ForceMeasurement } from "../types.js"
import {
  resolveDeviceKey,
  createDevice,
  resolveContext,
  outputJson,
  formatMeasurement,
  printHeader,
  setupSignalHandlers,
  waitForKeyToStop,
  fail,
} from "../utils.js"
import ora from "ora"

/**
 * Registers the `watch` command on the Commander program.
 *
 * @param program - The root Commander program.
 */
export function registerWatch(program: Command): void {
  program
    .command("watch [device]")
    .description("Stream force data indefinitely (Esc to stop, then show summary)")
    .action(async (deviceKey: string | undefined) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      let sampleCount = 0
      let peak = 0
      let sum = 0
      let unit: "kg" | "lbs" = ctx.unit
      const startTime = Date.now()

      /** Print the session summary to stdout. */
      const printSummary = () => {
        if (ctx.json) {
          outputJson({
            summary: {
              samples: sampleCount,
              peak: +peak.toFixed(2),
              mean: sampleCount > 0 ? +(sum / sampleCount).toFixed(2) : 0,
              elapsed: Date.now() - startTime,
              unit,
            },
          })
        } else {
          const elapsed = ((Date.now() - startTime) / 1000).toFixed(1)
          const mean = sampleCount > 0 ? (sum / sampleCount).toFixed(2) : "0.00"
          console.log(`\n${pc.bold("Session summary")}`)
          console.log(pc.dim("─".repeat(40)))
          console.log(`  ${pc.cyan("Samples:".padEnd(18))}${sampleCount}`)
          console.log(`  ${pc.cyan("Peak:".padEnd(18))}${peak.toFixed(2)} ${unit}`)
          console.log(`  ${pc.cyan("Mean:".padEnd(18))}${mean} ${unit}`)
          console.log(`  ${pc.cyan("Elapsed:".padEnd(18))}${elapsed}s`)
          console.log(pc.dim("─".repeat(40)))
        }
      }

      device.notify((data: ForceMeasurement) => {
        sampleCount++
        if (data.current > peak) peak = data.current
        sum += data.current
        unit = data.unit
        if (ctx.json) {
          outputJson(data)
        } else {
          console.log(formatMeasurement(data))
        }
      }, ctx.unit)

      const spinner = ctx.json ? null : ora(`Connecting to ${pc.bold(name)}...`).start()

      try {
        await device.connect(async () => {
          spinner?.succeed(`Connected to ${pc.bold(name)}`)

          setupSignalHandlers(device, printSummary)

          const streamFn = device.stream
          if (typeof streamFn !== "function") {
            device.disconnect()
            fail("Stream not supported on this device.")
          }

          if (!ctx.json) {
            printHeader(`Watching ${name}`)
          }

          await streamFn(0)
          await waitForKeyToStop(ctx.json ? undefined : "Press Esc to stop and see summary")
          await device.stop?.()
          printSummary()
        })
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        spinner?.fail(`Connection failed: ${message}`)
        fail(`Connection to ${name} failed: ${message}`)
      }
    })
}
