import type { Command } from "commander"
import { runCriticalForceAction } from "../menus/stream-actions/critical-force.js"
import { connectAndRun, createDevice, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

/**
 * Registers the `critical-force` command.
 */
export function registerCriticalForce(program: Command): void {
  program
    .command("critical-force [device]")
    .alias("critical")
    .alias("crictal-force")
    .description("Run the 24x (7s pull / 3s rest) critical force test")
    .action(async (deviceKey: string | undefined) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      if (!ctx.json) {
        printHeader(`Critical Force – ${name}`)
      }

      await connectAndRun(device, name, async (d) => runCriticalForceAction(d, { ctx }), ctx, {
        setupDefaultNotify: false,
      })
    })
}
