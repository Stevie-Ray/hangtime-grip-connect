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
    .option("-u, --unit <kg|lbs|n>", "Force unit for test output", "kg")

  registerCommands(program)
  if (process.stdout.isTTY && !process.argv.includes("--json")) {
    console.log(STARTUP_SPLASH)
    console.log("")
  }
  await program.parseAsync()
}

main().catch((error: unknown) => {
  if (isPromptExitError(error)) process.exit(0)
  const message = error instanceof Error ? error.message : String(error)
  console.error(`\n${message}`)
  process.exit(1)
})
