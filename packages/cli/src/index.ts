#!/usr/bin/env node

/**
 * Entry point for the Grip Connect CLI.
 *
 * Sets up the Commander program with global options, registers all
 * commands, and handles top-level errors so individual commands never
 * need to call `process.exit` directly.
 */

import { createRequire } from "node:module"
import process from "node:process"
import { Command } from "commander"
import { registerCommands } from "./commands/index.js"

const require = createRequire(import.meta.url)
const { version } = require("../package.json") as { version: string }

const program = new Command()

program
  .name("grip-connect")
  .description("CLI tool for connecting to grip strength training devices")
  .version(version)
  .option("--json", "Output machine-readable newline-delimited JSON")
  .option("--no-color", "Disable colored output")
  .option("-u, --unit <kg|lbs>", "Force unit for stream/watch output", "kg")

registerCommands(program)

program.parseAsync().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\n${message}`)
  process.exit(1)
})
