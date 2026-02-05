/**
 * `grip-connect` (no subcommand) -- interactive flow:
 * pick device -> connect -> pick action -> run -> loop.
 */

import type { Command } from "commander"
import input from "@inquirer/input"
import select from "@inquirer/select"
import pc from "picocolors"
import type { RunOptions } from "../types.js"
import { pickDevice, pickAction, createDevice, connectAndRun, buildActions, resolveContext } from "../utils.js"

/**
 * Registers the default (no-command) interactive flow.
 *
 * After connecting, the user can pick actions in a loop until they
 * choose "Disconnect & exit".
 *
 * @param program - The root Commander program.
 */
export function registerInteractive(program: Command): void {
  program.action(async () => {
    const ctx = resolveContext(program)
    const deviceKey = await pickDevice()
    const { device, name } = createDevice(deviceKey)

    await connectAndRun(
      device,
      name,
      async (d) => {
        let keepGoing = true
        while (keepGoing) {
          const actions = buildActions(deviceKey)
          const action = await pickAction(actions)

          if (action.name === "Disconnect") {
            keepGoing = false
            if (!ctx.json) {
              console.log(pc.green("\nDisconnecting.\n"))
            }
            break
          }

          // Prompt for relevant options based on the action
          const opts: RunOptions = { ctx }

          if (["Stream", "Stream & download", "Tare"].includes(action.name)) {
            const raw = await input({
              message: "Duration in seconds:",
              default: action.name === "Tare" ? "5" : "10",
            })
            opts.duration = parseFloat(raw) * 1000
          }

          if (["Stream & download", "Download"].includes(action.name)) {
            opts.format = await select({
              message: "Export format:",
              choices: [
                { name: "CSV", value: "csv" as const },
                { name: "JSON", value: "json" as const },
                { name: "XML", value: "xml" as const },
              ],
            })
          }

          await action.run(d, opts)
          console.log()
        }
      },
      ctx,
    )
  })
}
