import type { Command } from "commander"
import { createInteractiveDevice, pickInteractiveDevice } from "../menus/device-list/index.js"
import { runInteractiveActionLoop } from "../menus/interactive/run-action-loop.js"
import { connectAndRun, resolveContext } from "../utils.js"

/**
 * Registers the default (no-command) interactive flow.
 *
 * Pick device -> connect -> pick action -> run -> loop. Choosing "Disconnect"
 * disconnects and returns to the device picker so you can connect to another device.
 *
 * @param program - The root Commander program.
 */
export function registerInteractive(program: Command): void {
  program.action(async () => {
    const ctx = resolveContext(program)

    while (true) {
      const deviceKey = await pickInteractiveDevice()
      const { device, name } = createInteractiveDevice(deviceKey)

      await connectAndRun(device, name, (d) => runInteractiveActionLoop(d, deviceKey, ctx), ctx)
    }
  })
}
