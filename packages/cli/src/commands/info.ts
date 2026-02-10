/**
 * `grip-connect info [device]` -- shows all available device properties.
 */

import type { Command } from "commander"
import pc from "picocolors"
import { INFO_METHODS } from "../info-methods.js"
import {
  resolveDeviceKey,
  createDevice,
  connectAndRun,
  resolveContext,
  printResult,
  printHeader,
  outputJson,
} from "../utils.js"

/**
 * Registers the `info` command on the Commander program.
 *
 * @param program - The root Commander program.
 */
export function registerInfo(program: Command): void {
  program
    .command("info [device]")
    .description("Connect and show device information (battery, firmware, device ID, calibration, etc.)")
    .action(async (deviceKey: string | undefined) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      await connectAndRun(
        device,
        name,
        async (d) => {
          const info: Record<string, string | undefined> = {}
          const device = d as unknown as Record<string, unknown>

          for (const entry of INFO_METHODS) {
            const fn = device[entry.key]
            if (typeof fn === "function") {
              try {
                info[entry.key] = (await (fn as () => Promise<string | undefined>)()) ?? undefined
              } catch {
                info[entry.key] = undefined
              }
            }
          }

          if (ctx.json) {
            outputJson(info)
          } else {
            printHeader(`${name} Info`)
            for (const entry of INFO_METHODS) {
              if (entry.key in info) {
                printResult(entry.label, info[entry.key])
              }
            }
            console.log(pc.dim("─".repeat(40)))
          }
        },
        ctx,
      )
    })
}
