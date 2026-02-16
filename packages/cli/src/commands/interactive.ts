import type { Command } from "commander"
import input from "@inquirer/input"
import type { CliDevice, OutputContext, RunOptions } from "../types.js"
import { pickDevice, pickAction, createDevice, connectAndRun, buildActions, resolveContext } from "../utils.js"

/**
 * Pick action -> run -> repeat until Disconnect or Sleep.
 * Keeps the user in an action menu for the same device so they can run multiple
 * operations (Live Data, Tare, Download, etc.) without reconnecting.
 */
async function runActionLoop(device: CliDevice, deviceKey: string, ctx: OutputContext): Promise<void> {
  const actions = buildActions(deviceKey, ctx)
  const action = await pickAction(actions)

  if (action.name === "Disconnect") {
    await action.run(device, { ctx })
    return
  }

  const opts: RunOptions = { ctx }
  if (["Live Data", "Tare"].includes(action.name)) {
    const needsDuration = action.name === "Tare"
    const raw = await input({
      message: needsDuration ? "Duration in seconds:" : "Duration in seconds (Optional):",
      default: action.name === "Tare" ? "5" : "",
    })
    const trimmed = raw.trim()
    if (!needsDuration && trimmed === "") {
      opts.duration = 0
    } else {
      const sec = parseFloat(trimmed || (action.name === "Tare" ? "5" : "10"))
      opts.duration = (Number.isNaN(sec) ? 0 : sec) * 1000
    }
  }

  await action.run(device, opts)
  if (action.name === "Sleep") return

  return runActionLoop(device, deviceKey, ctx)
}

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
      const deviceKey = await pickDevice()
      const { device, name } = createDevice(deviceKey)

      await connectAndRun(device, name, (d) => runActionLoop(d, deviceKey, ctx), ctx)
    }
  })
}
