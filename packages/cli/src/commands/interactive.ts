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

      await connectAndRun(
        device,
        name,
        async (d) => {
          const unitAction = (): Action => ({
            name: `Unit (${ctx.unit})`,
            description: "Set stream output to kilogram, pound, or newton",
            run: async (_d, opts) => {
              const unit = await select({
                message: "Unit:",
                choices: [
                  { name: "Kilogram", value: "kg" as const },
                  { name: "Pound", value: "lbs" as const },
                  { name: "Newton", value: "n" as const },
                ],
              })
              if (opts.ctx) opts.ctx.unit = unit
              if (!ctx.json) console.log(pc.dim(`Force output: ${unit}`))
            },
          })
          let keepGoing = true
          while (keepGoing) {
            const built = buildActions(deviceKey)
            const afterStreamIndex = built.findIndex((a) => a.name !== "Stream")
            const insertAt = afterStreamIndex === -1 ? built.length : afterStreamIndex
            const actions = [...built.slice(0, insertAt), unitAction(), ...built.slice(insertAt)]
            const action = await pickAction(actions)

            if (action.name === "Disconnect") {
              keepGoing = false
              await action.run(d, { ctx })
              break
            }

            // Prompt for relevant options based on the action
            const opts: RunOptions = { ctx }

            if (["Stream", "Tare"].includes(action.name)) {
              const needsDuration = action.name === "Tare"
              const raw = await input({
                message: needsDuration ? "Duration in seconds:" : "Duration in seconds (none for indefinite):",
                default: action.name === "Tare" ? "5" : "10",
              })
              const trimmed = raw.trim()
              if (!needsDuration && trimmed === "") {
                opts.duration = 0
              } else {
                const sec = parseFloat(trimmed || (action.name === "Tare" ? "5" : "10"))
                opts.duration = (Number.isNaN(sec) ? 0 : sec) * 1000
              }
            }

            await action.run(d, opts)
            if (action.name === "Sleep") {
              keepGoing = false
              break
            }
            console.log()
          }
        },
        ctx,
      )
    }
  })
}
