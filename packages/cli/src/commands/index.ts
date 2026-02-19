/**
 * Command registration aggregator.
 *
 * Imports every command module and wires it onto the root Commander program.
 */

import type { Command } from "commander"
import { registerActive } from "./active.js"
import { registerCriticalForce } from "./critical-force.js"
import { registerDownload } from "./download.js"
import { registerInfo } from "./info.js"
import { registerInteractive } from "./interactive.js"
import { registerList } from "./list.js"
import { registerStream } from "./stream.js"
import { registerTare } from "./tare.js"
import { registerWatch } from "./watch.js"

/**
 * Registers all CLI commands on the Commander program.
 *
 * @param program - The root Commander program instance.
 */
export function registerCommands(program: Command): void {
  registerList(program)
  registerStream(program)
  registerCriticalForce(program)
  registerWatch(program)
  registerInfo(program)
  registerDownload(program)
  registerTare(program)
  registerActive(program)
  registerInteractive(program)
}
