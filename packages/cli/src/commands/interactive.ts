/**
 * `grip-connect` (no subcommand) -- interactive flow:
 * pick device -> connect -> pick action -> run -> loop.
 */

import type { Command } from "commander"
import input from "@inquirer/input"
import select from "@inquirer/select"
import pc from "picocolors"
import type { Action, RunOptions } from "../types.js"
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
        const unitAction = (): Action => ({
          name: `Unit (${ctx.unit})`,
          description: "Set stream output to kg or lbs",
          run: async (_d, opts) => {
            const unit = await select({
              message: "Unit:",
              choices: [
                { name: "kg", value: "kg" as const },
                { name: "lbs", value: "lbs" as const },
              ],
            })
            if (opts.ctx) opts.ctx.unit = unit
            if (!ctx.json) console.log(pc.dim(`Force output: ${unit}`))
          },
        })
        let keepGoing = true
        while (keepGoing) {
          const built = buildActions(deviceKey)
          const afterStreamIndex = built.findIndex((a) => a.name !== "Stream" && a.name !== "Stream & download")
          const insertAt = afterStreamIndex === -1 ? built.length : afterStreamIndex
          const actions = [...built.slice(0, insertAt), unitAction(), ...built.slice(insertAt)]
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
