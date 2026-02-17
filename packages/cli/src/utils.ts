/**
 * Shared CLI utilities: prompts, connect helper, output formatting,
 * signal handling, and colored terminal output.
 */

import process from "node:process"
import readline from "node:readline"
import select from "@inquirer/select"
import ora from "ora"
import pc from "picocolors"
import { devices } from "./devices/index.js"
import type { Action, CliDevice, ForceMeasurement, OutputContext } from "./types.js"

/** Resolves the output context from root Commander options. */
export function resolveContext(program: { opts(): Record<string, unknown> }): OutputContext {
  const opts = program.opts()
  const unit = opts["unit"] === "lbs" ? "lbs" : opts["unit"] === "n" ? "n" : "kg"
  return { json: Boolean(opts["json"]), unit }
}

/** Formats a force measurement with optional distribution fields. */
export function formatMeasurement(data: ForceMeasurement): string {
  const current = pc.bold(`${data.current.toFixed(2)} ${data.unit}`)
  const peak = pc.dim(`Peak: ${data.peak.toFixed(2)} ${data.unit}`)
  const mean = pc.dim(`Mean: ${data.mean.toFixed(2)} ${data.unit}`)
  const main = `${current}  ${peak}  ${mean}`

  const dist = data.distribution
  const hasDistribution = dist && (dist.left !== undefined || dist.center !== undefined || dist.right !== undefined)
  if (!hasDistribution) return main

  const unit = data.unit
  const parts: string[] = []
  if (dist.left !== undefined) {
    parts.push(pc.dim(`Left: ${dist.left.current.toFixed(2)} ${dist.left.unit ?? unit}`))
  }
  if (dist.center !== undefined) {
    parts.push(pc.dim(`Center: ${dist.center.current.toFixed(2)} ${dist.center.unit ?? unit}`))
  }
  if (dist.right !== undefined) {
    parts.push(pc.dim(`Right: ${dist.right.current.toFixed(2)} ${dist.right.unit ?? unit}`))
  }
  return parts.length > 0 ? `${main}  ${parts.join(" ")}` : main
}

/** Writes newline-delimited JSON output. */
export function outputJson(value: unknown): void {
  console.log(JSON.stringify(value))
}

/** Prints a labeled field/value output line. */
export function printResult(label: string, value: string | undefined): void {
  console.log(`  ${pc.cyan(label.padEnd(18))}${value ?? pc.dim("Not supported")}`)
}

/** Prints a section header and rule. */
export function printHeader(title: string): void {
  console.log(`\n${pc.bold(title)}`)
  console.log(pc.dim("─".repeat(40)))
}

/** Prints a success message. */
export function printSuccess(message: string): void {
  console.log(pc.green(`\n${message}\n`))
}

/** Throws a CLI-formatted error. */
export function fail(message: string): never {
  throw new Error(pc.red(message))
}

/** Prompt for a device from the registry. */
export async function pickDevice(): Promise<string> {
  return select({
    message: "Select a device:",
    choices: Object.entries(devices).map(([key, def]) => {
      const disabled = key === "wh-c06"
      return {
        name: disabled ? `${def.name}` : def.name,
        value: key,
        ...(disabled && { disabled: true }),
      }
    }),
  })
}

/** Prompt for an action. */
export async function pickAction(actions: Action[], message = "What do you want to do?"): Promise<Action> {
  return select({
    message,
    choices: actions.map((action) => {
      const color = action.nameColor ? pc[action.nameColor] : (s: string) => s
      return {
        name: `${color(action.name)} ${pc.dim("–")} ${pc.dim(action.description)}`,
        value: action,
        ...(action.disabled && { disabled: true }),
      }
    }),
  })
}

/** Resolve a device key from CLI arg or prompt. */
export async function resolveDeviceKey(deviceKey: string | undefined): Promise<string> {
  if (deviceKey) return deviceKey.toLowerCase()
  return pickDevice()
}

/** Create a device instance from the registry. */
export function createDevice(deviceKey: string): { device: CliDevice; name: string } {
  const key = deviceKey.toLowerCase()
  const def = devices[key]
  if (!def) {
    fail(`Unknown device: ${deviceKey}\nRun 'grip-connect list' to see supported devices.`)
  }
  return { device: new def.class() as unknown as CliDevice, name: def.name }
}

/** Register signal handlers and perform cleanup before exit. */
export function setupSignalHandlers(device: CliDevice, onCleanup?: () => void): () => void {
  const handler = () => {
    onCleanup?.()
    try {
      device.disconnect()
    } catch {
      // best-effort cleanup
    }
    process.exit(0)
  }

  process.on("SIGINT", handler)
  process.on("SIGTERM", handler)

  return () => {
    process.removeListener("SIGINT", handler)
    process.removeListener("SIGTERM", handler)
  }
}

/** Register default stream output callback on a device. */
export function setupNotify(device: CliDevice, ctx: OutputContext): void {
  device.notify((data: ForceMeasurement) => {
    if (ctx.json) {
      outputJson(data)
    } else {
      console.log(formatMeasurement(data))
    }
  }, ctx.unit)
}

/** Silence stream output callback. */
export function muteNotify(device: CliDevice): void {
  device.notify(() => {
    // muted callback
  })
}

export interface WaitForKeyOptions {
  message?: string
  extraKeys?: Record<number, () => void>
}

/** Resolve when Escape is pressed (TTY only). */
export function waitForKeyToStop(messageOrOptions?: string | WaitForKeyOptions): Promise<void> {
  if (!process.stdin.isTTY) {
    return Promise.reject(
      new Error("Interactive stop key is unavailable in non-interactive mode. Run in a TTY terminal."),
    )
  }

  const message = typeof messageOrOptions === "string" ? messageOrOptions : messageOrOptions?.message
  const extraKeys =
    typeof messageOrOptions === "object" && messageOrOptions?.extraKeys ? messageOrOptions.extraKeys : undefined

  return new Promise((resolve) => {
    let done = false

    const cleanup = () => {
      if (done) return
      done = true
      process.stdin.removeListener("keypress", onKeypress)
      process.stdin.setRawMode?.(false)
      process.stdin.pause()
      resolve()
    }

    const onKeypress = (_str: string, key: readline.Key) => {
      if (key.name === "escape") {
        cleanup()
        return
      }

      if (extraKeys && key.sequence) {
        const code = key.sequence.charCodeAt(0)
        if (code in extraKeys) {
          const cb = extraKeys[code as keyof typeof extraKeys]
          if (cb) setImmediate(cb)
        }
      }
    }

    if (message) {
      console.log(pc.dim(message))
    }

    readline.emitKeypressEvents(process.stdin)
    process.stdin.setRawMode?.(true)
    process.stdin.resume()
    process.stdin.on("keypress", onKeypress)
  })
}

export interface ConnectAndRunOptions {
  onSignal?: () => void
  setupDefaultNotify?: boolean
  printDisconnectedMessage?: boolean
}

/** Connect to a device, run callback, then disconnect. */
export async function connectAndRun(
  device: CliDevice,
  name: string,
  callback: (device: CliDevice) => Promise<void>,
  ctx: OutputContext = { json: false, unit: "kg" },
  options: ConnectAndRunOptions = {},
): Promise<void> {
  if (typeof device.active === "function") {
    device.active(() => {
      // silence core default active callback
    })
  }

  const spinner = ctx.json ? null : ora(`Connecting to ${pc.bold(name)}...`).start()

  return new Promise<void>((resolve, reject) => {
    device
      .connect(async () => {
        spinner?.succeed(`Connected to ${pc.bold(name)}`)
        const cleanupSignalHandlers = setupSignalHandlers(device, options.onSignal)

        if (options.setupDefaultNotify !== false) {
          setupNotify(device, ctx)
        }

        try {
          await callback(device)
          resolve()
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error)
          reject(new Error(message))
        } finally {
          cleanupSignalHandlers()
          device.disconnect()
          if (!ctx.json && options.printDisconnectedMessage !== false) {
            console.log(pc.dim("\nDisconnected."))
          }
        }
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        spinner?.fail(`Connection failed: ${message}`)
        reject(new Error(pc.red(`Connection to ${name} failed: ${message}`)))
      })
  })
}
