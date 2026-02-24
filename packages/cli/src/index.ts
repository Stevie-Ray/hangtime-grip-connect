#!/usr/bin/env node

/**
 * Entry point for the @hangtime/grip-connect CLI.
 *
 * Sets up the Commander program with global options, registers all
 * commands, and handles top-level errors so individual commands never
 * need to call `process.exit` directly.
 */

import { createRequire } from "node:module"
import process from "node:process"
import { Command } from "commander"
import { devices } from "./devices/index.js"

const require = createRequire(import.meta.url)
const { version } = require("../package.json") as { version: string }

const STARTUP_SPLASH = `
                                        :--------------:                                        
                                        @@@@@@@@@@@@@@@@                                        
                                        @@@@@@@@@@@@@@@@                                        
                                        :==============:                                        
                                                                                                
                                        #@+   @@@@   *@*                                        
                                         @@:  %@@%  :@@   .      :@=                            
                                  :%@@    %@%+.==:+@@%    @@%= .@@@@@=                          
                                *@@@@@@-    %@@@@@@%    :@@@@@@@@@@@@-                          
                              *@@@@@@@*     :@@@@@@:     =@@@@@@@@@=                            
                             @@@@@@#        :@@@@@@:        #@@@@@@                             
                           :@@@@@@          :@@@@@@:          @@@@@@-                           
                          :@@@@@%           :@@@@@@:           %@@@@@:                          
                          @@@@@#            :@@@@@@:            #@@@@@                          
                         @@@@@%             :@@  @@:             @@@@@%                         
                         @@@@@              :@@  @@:              @@@@@                         
                        +@@@@%              :@@  @@:              @@@@@=                        
                        %@@@@+              :@@  @@:              *@@@@*                        
                        %@@@@=               =-  -=               =@@@@%                        
                        #@@@@#                                    %@@@@*                        
                        -@@@@@                                    @@@@@:                        
                         @@@@@=                                  =@@@@@                         
                         =@@@@@                                  @@@@@=                         
                          %@@@@@                                @@@@@#                          
                           @@@@@@-                            -@@@@@%                           
                            #@@@@@%                          %@@@@@*                            
                             -@@@@@@%.                    .%@@@@@@.                             
                               %@@@@@@@*.              :*@@@@@@@*                               
                                .%@@@@@@@@@@%**==**%@@@@@@@@@@%                                 
                                   =%@@@@@@@@@@@@@@@@@@@@@@#-                                   
                                       -*@@@@@@@@@@@@@@*:                                       
                                              :--.`

function isPromptExitError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return typeof error === "string" && error.includes("User force closed the prompt with SIGINT")
  }
  return (
    error.name === "ExitPromptError" ||
    error.name === "CancelPromptError" ||
    error.message.includes("User force closed the prompt with SIGINT")
  )
}

const GLOBAL_FLAGS_WITH_VALUE = new Set(["-u", "--unit"])
const COMMAND_NAMES = new Set([
  "list",
  "live",
  "peak-force-mvc",
  "peak-force",
  "mvc",
  "rfd",
  "endurance",
  "repeaters",
  "critical-force",
  "critical",
  "crictal-force",
  "info",
  "download",
  "tare",
  "active",
  "interactive",
  "action",
  "help",
])

function isFlagToken(value: string): boolean {
  return value.startsWith("-")
}

function findFirstPositionalPair(argv: string[]): { firstIndex: number; secondIndex: number } | null {
  const args = argv.slice(2)
  let firstIndex = -1
  let secondIndex = -1

  for (let i = 0; i < args.length; i++) {
    const token = args[i]
    if (isFlagToken(token)) {
      if (GLOBAL_FLAGS_WITH_VALUE.has(token)) {
        i += 1
      }
      continue
    }
    if (firstIndex === -1) {
      firstIndex = i + 2
      continue
    }
    secondIndex = i + 2
    break
  }

  if (firstIndex === -1 || secondIndex === -1) {
    return null
  }

  return { firstIndex, secondIndex }
}

function normalizeDeviceFirstArgv(argv: string[]): string[] {
  const pair = findFirstPositionalPair(argv)
  if (!pair) return argv

  const first = argv[pair.firstIndex]?.toLowerCase() ?? ""
  const second = argv[pair.secondIndex]?.toLowerCase() ?? ""
  if (!devices[first]) return argv
  if (!COMMAND_NAMES.has(second)) return argv

  const normalized = [...argv]
  normalized[pair.firstIndex] = second
  normalized[pair.secondIndex] = first
  return normalized
}

process.on("unhandledRejection", (reason: unknown) => {
  if (isPromptExitError(reason)) {
    process.exit(0)
  }
})

async function main(): Promise<void> {
  if (process.argv.includes("--no-color")) {
    process.env["NO_COLOR"] = "1"
  }

  const { registerCommands } = await import("./commands/index.js")

  const program = new Command()
  program
    .name("@hangtime/cli")
    .description("CLI tool for connecting to grip strength training devices")
    .version(version)
    .option("--json", "Output machine-readable newline-delimited JSON")
    .option("--no-color", "Disable colored output")
    .option("-u, --unit <kg|lbs|n>", "Force unit for test output (overrides saved preference)")

  registerCommands(program)
  if (process.stdout.isTTY && !process.argv.includes("--json")) {
    console.log(STARTUP_SPLASH)
    console.log("")
  }
  await program.parseAsync(normalizeDeviceFirstArgv(process.argv))
}

main().catch((error: unknown) => {
  if (isPromptExitError(error)) process.exit(0)
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\n${message}`)
  process.exit(1)
})
