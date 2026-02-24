/**
 * `grip-connect list` -- lists all supported devices and their capabilities.
 */

import type { Command } from "commander"
import pc from "picocolors"
import { devices } from "../devices/index.js"
import type { CliDevice } from "../types.js"
import { outputJson, resolveContext } from "../utils.js"

/**
 * Registers the `list` command on the Commander program.
 *
 * @param program - The root Commander program.
 */
export function registerList(program: Command): void {
  program
    .command("list")
    .description("List all supported devices and their capabilities")
    .action(() => {
      const ctx = resolveContext(program)

      if (ctx.json) {
        const out = Object.entries(devices).map(([key, def]) => {
          const d = new def.class() as unknown as CliDevice
          return {
            key,
            name: def.name,
            capabilities: {
              stream: typeof d.stream === "function",
              battery: typeof d.battery === "function",
              tare: typeof d.tare === "function",
              download: typeof d.download === "function",
              active: typeof d.active === "function",
            },
          }
        })
        outputJson({ devices: out })
        return
      }

      console.log(`\n${pc.bold("Supported devices")}\n`)
      console.log(`  ${pc.dim("KEY".padEnd(16))}${pc.dim("NAME".padEnd(18))}${pc.dim("CAPABILITIES")}`)
      console.log(pc.dim("  " + "─".repeat(60)))

      for (const [key, def] of Object.entries(devices)) {
        const d = new def.class() as unknown as CliDevice
        const caps: string[] = []
        if (typeof d.stream === "function") caps.push(pc.green("stream"))
        if (typeof d.battery === "function") caps.push(pc.cyan("battery"))
        if (typeof d.tare === "function") caps.push(pc.yellow("tare"))
        if (typeof d.download === "function") caps.push(pc.magenta("download"))
        if (typeof d.active === "function") caps.push(pc.blue("active"))
        console.log(`  ${key.padEnd(16)}${def.name.padEnd(18)}${caps.join(pc.dim(", "))}`)
      }

      console.log(`\n${pc.bold("Usage")}`)
      console.log(`  ${pc.dim("$")} grip-connect                              ${pc.dim("Interactive mode")}`)
      console.log(
        `  ${pc.dim("$")} grip-connect [device] [command] [options]   ${pc.dim("Device-first non-interactive mode")}`,
      )

      console.log(`\n${pc.bold("Commands")}`)
      console.log(`  ${pc.dim("$")} grip-connect list                           ${pc.dim("List supported devices")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] live                  ${pc.dim("Live force data")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] peak-force-mvc        ${pc.dim("Peak Force / MVC test")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] rfd                   ${pc.dim("RFD test")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] endurance             ${pc.dim("Endurance test")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] repeaters             ${pc.dim("Repeaters test")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] critical-force        ${pc.dim("Critical Force test")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] info                  ${pc.dim("Device information")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] download              ${pc.dim("Export session data")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] tare                  ${pc.dim("Tare calibration")}`)
      console.log(`  ${pc.dim("$")} grip-connect [device] active                ${pc.dim("Activity monitor")}`)
      console.log(
        `  ${pc.dim("$")} grip-connect action [device] [path]         ${pc.dim("Run/list interactive actions")}`,
      )

      console.log(`\n${pc.bold("Help")}`)
      console.log(`  ${pc.dim("$")} grip-connect --help`)
      console.log(`  ${pc.dim("$")} grip-connect live --help`)
      console.log(`  ${pc.dim("$")} grip-connect progressor live --help`)

      console.log(`\n${pc.dim("Example:")} grip-connect progressor live\n`)
    })
}
