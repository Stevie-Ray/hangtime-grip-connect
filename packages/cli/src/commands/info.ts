/**
 * `grip-connect info [device]` -- shows all available device properties.
 */

import type { Command } from "commander"
import { collectDeviceInfo, renderDeviceInfo } from "../services/device-info.js"
import { resolveDeviceKey, createDevice, connectAndRun, resolveContext } from "../utils.js"

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
          const info = await collectDeviceInfo(d)
          renderDeviceInfo(name, info, ctx)
        },
        ctx,
        { setupDefaultNotify: false },
      )
    })
}
