/**
 * Shared CLI utilities: prompts, connect helper, output formatting,
 * signal handling, and colored terminal output.
 */

import process from "node:process"
import select from "@inquirer/select"
import ora from "ora"
import pc from "picocolors"
import { devices } from "./devices/index.js"
import type { Action, CliDevice, ForceMeasurement, OutputContext, RunOptions } from "./types.js"

// ---------------------------------------------------------------------------
// Output context
// ---------------------------------------------------------------------------

/**
 * Resolves the {@link OutputContext} from the root Commander program options.
 *
 * Call this inside every command action to pick up `--json` / `--no-color`.
 *
 * @param program - The root Commander program instance.
 * @returns The resolved output context.
 */
export function resolveContext(program: { opts(): Record<string, unknown> }): OutputContext {
  const opts = program.opts()
  return { json: Boolean(opts["json"]) }
}

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

/**
 * Formats a single force measurement as a human-readable string with color.
 *
 * @param data - The force measurement to format.
 * @returns A formatted string such as `"12.34 kg  Peak: 15.00 kg  Mean: 11.20 kg"`.
 */
export function formatMeasurement(data: ForceMeasurement): string {
  const current = pc.bold(`${data.current.toFixed(2)} ${data.unit}`)
  const peak = pc.dim(`Peak: ${data.peak.toFixed(2)} ${data.unit}`)
  const mean = pc.dim(`Mean: ${data.mean.toFixed(2)} ${data.unit}`)
  return `${current}  ${peak}  ${mean}`
}

/**
 * Writes a JSON line to stdout (newline-delimited JSON).
 *
 * @param value - Any JSON-serializable value.
 */
export function outputJson(value: unknown): void {
  console.log(JSON.stringify(value))
}

/**
 * Prints a labelled result value to stdout with colored label.
 *
 * @param label - The label text (e.g. `"Battery:"`).
 * @param value - The value to display, or `undefined` for "Not supported".
 */
export function printResult(label: string, value: string | undefined): void {
  console.log(`  ${pc.cyan(label.padEnd(18))}${value ?? pc.dim("Not supported")}`)
}

/**
 * Prints a section header with a horizontal rule.
 *
 * @param title - The header text.
 */
export function printHeader(title: string): void {
  console.log(`\n${pc.bold(title)}`)
  console.log(pc.dim("─".repeat(40)))
}

/**
 * Prints a success message in green.
 *
 * @param message - The message to display.
 */
export function printSuccess(message: string): void {
  console.log(pc.green(`\n${message}\n`))
}

/**
 * Prints an error message in red and throws so the top-level handler
 * in `index.ts` can exit cleanly.
 *
 * @param message - The error message.
 * @throws {Error} Always throws with the given message.
 */
export function fail(message: string): never {
  throw new Error(pc.red(message))
}

// ---------------------------------------------------------------------------
// Prompts
// ---------------------------------------------------------------------------

/**
 * Prompts the user to pick a device from the registry.
 *
 * @returns The lowercase device key (e.g. `"progressor"`).
 */
export async function pickDevice(): Promise<string> {
  return select({
    message: "Select a device:",
    choices: Object.entries(devices).map(([key, def]) => ({
      name: def.name,
      value: key,
    })),
  })
}

/**
 * Prompts the user to pick an action from a list.
 *
 * @param actions - Available actions for the current device.
 * @returns The selected {@link Action} object.
 */
export async function pickAction(actions: Action[]): Promise<Action> {
  return select({
    message: "What do you want to do?",
    choices: actions.map((action) => ({
      name: `${action.name} ${pc.dim("–")} ${pc.dim(action.description)}`,
      value: action,
    })),
  })
}

// ---------------------------------------------------------------------------
// Device helpers
// ---------------------------------------------------------------------------

/**
 * Resolves a device key, prompting interactively if not provided.
 *
 * @param deviceKey - Optional device key from the command line.
 * @returns The resolved lowercase device key.
 */
export async function resolveDeviceKey(deviceKey: string | undefined): Promise<string> {
  if (deviceKey) return deviceKey.toLowerCase()
  return pickDevice()
}

/**
 * Instantiates a {@link CliDevice} from the registry.
 *
 * @param deviceKey - The device key to look up.
 * @returns An object containing the device instance and its display name.
 * @throws {Error} If the device key is unknown.
 */
export function createDevice(deviceKey: string): { device: CliDevice; name: string } {
  const key = deviceKey.toLowerCase()
  const def = devices[key]
  if (!def) {
    fail(`Unknown device: ${deviceKey}\nRun 'grip-connect list' to see supported devices.`)
  }
  return { device: new def.class() as unknown as CliDevice, name: def.name }
}

// ---------------------------------------------------------------------------
// Signal handling
// ---------------------------------------------------------------------------

/**
 * Registers SIGINT and SIGTERM handlers that gracefully disconnect the
 * device before exiting.
 *
 * @param device - The connected device to disconnect on signal.
 * @param onCleanup - Optional extra work to run before exit (e.g. print summary).
 */
export function setupSignalHandlers(device: CliDevice, onCleanup?: () => void): void {
  const handler = () => {
    onCleanup?.()
    try {
      device.disconnect()
    } catch {
      /* best-effort */
    }
    process.exit(0)
  }
  process.on("SIGINT", handler)
  process.on("SIGTERM", handler)
}

// ---------------------------------------------------------------------------
// Connect & run
// ---------------------------------------------------------------------------

/**
 * Registers the standard force-measurement notify callback on a device.
 *
 * In JSON mode it emits newline-delimited JSON; otherwise it prints a
 * colored line.  Call {@link muteNotify} to silence output between actions.
 *
 * @param device - The device to register the callback on.
 * @param ctx - Output context for JSON / color flags.
 */
export function setupNotify(device: CliDevice, ctx: OutputContext): void {
  device.notify((data: ForceMeasurement) => {
    if (ctx.json) {
      outputJson(data)
    } else {
      console.log(formatMeasurement(data))
    }
  })
}

/**
 * Silences the notify callback so no force data is printed.
 *
 * Useful between actions in interactive mode or after a stream completes.
 *
 * @param device - The device to mute.
 */
export function muteNotify(device: CliDevice): void {
  device.notify(() => {
    /* muted */
  })
}

/**
 * Connects to a device with a spinner, runs a callback, then disconnects.
 *
 * Notify is **not** set up automatically -- call {@link setupNotify} inside
 * the callback when you need force-measurement output.  This avoids stale
 * output bleeding into interactive prompts.
 *
 * @param device - The device to connect to.
 * @param name - The human-readable device name (for spinner text).
 * @param callback - Async work to perform once connected.
 * @param ctx - Output context for JSON / color flags.
 */
export async function connectAndRun(
  device: CliDevice,
  name: string,
  callback: (device: CliDevice) => Promise<void>,
  ctx: OutputContext = { json: false },
): Promise<void> {
  // Silence the default activeCallback (which logs true/false to stdout)
  if (typeof device.active === "function") {
    device.active(() => {
      /* silenced */
    })
  }

  const spinner = ctx.json ? null : ora(`Connecting to ${pc.bold(name)}...`).start()

  // The core's connect() fires onSuccess without awaiting it, so we wrap
  // everything in a Promise that only resolves when the callback finishes.
  return new Promise<void>((resolve, reject) => {
    device
      .connect(async () => {
        spinner?.succeed(`Connected to ${pc.bold(name)}`)
        setupSignalHandlers(device)
        try {
          await callback(device)
        } finally {
          device.disconnect()
          if (!ctx.json) {
            console.log(pc.dim("\nDisconnected."))
          }
        }
        resolve()
      })
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error)
        spinner?.fail(`Connection failed: ${message}`)
        reject(new Error(pc.red(`Connection to ${name} failed: ${message}`)))
      })
  })
}

// ---------------------------------------------------------------------------
// Action builder
// ---------------------------------------------------------------------------

/**
 * Builds the full list of actions for a device: shared actions first,
 * then device-specific actions, then disconnect.
 *
 * Shared actions are derived dynamically from the device capabilities
 * (e.g. `stream`, `battery`, `tare`, `download`).
 *
 * @param deviceKey - The device registry key.
 * @returns An ordered array of {@link Action} objects.
 */
export function buildActions(deviceKey: string): Action[] {
  const key = deviceKey.toLowerCase()
  const def = devices[key]
  if (!def) return []

  const device = new def.class() as unknown as CliDevice
  const shared: Action[] = []

  if (typeof device.stream === "function") {
    shared.push({
      name: "Stream",
      description: "Live force data for a duration",
      run: async (d: CliDevice, opts: RunOptions) => {
        const duration = opts.duration ?? 10000
        if (typeof d.stream !== "function") return
        if (!opts.ctx?.json) {
          console.log(pc.cyan(`\nStreaming for ${duration / 1000} seconds...\n`))
        }
        setupNotify(d, opts.ctx ?? { json: false })
        await d.stream(duration)
        await d.stop?.()
        muteNotify(d)
      },
    })
    if (typeof device.download === "function") {
      shared.push({
        name: "Stream & download",
        description: "Stream then export session data (CSV/JSON/XML)",
        run: async (d: CliDevice, opts: RunOptions) => {
          const duration = opts.duration ?? 10000
          const format = opts.format ?? "csv"
          if (typeof d.stream !== "function" || typeof d.download !== "function") return
          if (!opts.ctx?.json) {
            console.log(pc.cyan(`\nStreaming for ${duration / 1000} seconds, then exporting ${format}...\n`))
          }
          setupNotify(d, opts.ctx ?? { json: false })
          await d.stream(duration)
          await d.stop?.()
          muteNotify(d)
          await d.download(format)
          if (!opts.ctx?.json) {
            printSuccess(`Data exported as ${format.toUpperCase()}.`)
          }
        },
      })
    }
  }

  if (typeof device.battery === "function" || typeof device.firmware === "function") {
    shared.push({
      name: "Info",
      description: "Battery and firmware",
      run: async (d: CliDevice, opts: RunOptions) => {
        if (opts.ctx?.json) {
          const info: Record<string, string | undefined> = {}
          try {
            info["battery"] = await d.battery?.()
          } catch {
            /* skip */
          }
          try {
            info["firmware"] = await d.firmware?.()
          } catch {
            /* skip */
          }
          outputJson(info)
        } else {
          printHeader(`${def.name} Info`)
          try {
            printResult("Battery:", await d.battery?.())
          } catch {
            printResult("Battery:", undefined)
          }
          try {
            printResult("Firmware:", await d.firmware?.())
          } catch {
            printResult("Firmware:", undefined)
          }
          console.log(pc.dim("─".repeat(40)))
        }
      },
    })
  }

  if (typeof device.tare === "function") {
    shared.push({
      name: "Tare",
      description: "Zero calibration",
      run: async (d: CliDevice, opts: RunOptions) => {
        const duration = opts.duration ?? 5000
        const tareFn = d.tare
        if (typeof tareFn !== "function") return
        const started = tareFn(duration)
        if (started) {
          const spinner = opts.ctx?.json
            ? null
            : ora(`Tare calibration (${duration / 1000} s). Keep device still...`).start()
          await new Promise((r) => setTimeout(r, duration))
          spinner?.succeed("Tare calibration complete.")
        } else {
          fail("Tare could not be started (already active?).")
        }
      },
    })
  }

  if (typeof device.download === "function") {
    shared.push({
      name: "Download",
      description: "Export session data",
      run: async (d: CliDevice, opts: RunOptions) => {
        const format = opts.format ?? "csv"
        const downloadFn = d.download
        if (typeof downloadFn !== "function") return
        await downloadFn(format)
        if (!opts.ctx?.json) {
          printSuccess(`Data exported as ${format.toUpperCase()}.`)
        }
      },
    })
  }

  // Device-specific actions
  const specific = def.actions

  // Always-available disconnect
  const disconnect: Action = {
    name: "Disconnect",
    description: "Connect then disconnect (smoke test)",
    run: async (_d: CliDevice, opts: RunOptions) => {
      if (!opts.ctx?.json) {
        printSuccess("Connected successfully. Disconnecting.")
      }
    },
  }

  return [...shared, ...specific, disconnect]
}
