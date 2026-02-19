import input from "@inquirer/input"
import select from "@inquirer/select"
import process from "node:process"
import readline from "node:readline"
import ora from "ora"
import pc from "picocolors"
import { createChartRenderer } from "../chart.js"
import { fail, formatMeasurement, muteNotify, outputJson, printSuccess, waitForKeyToStop } from "../utils.js"
import type { CliDevice, ExportFormat, ForceMeasurement, OutputContext } from "../types.js"

interface LiveDataOptions {
  durationMs?: number | undefined
  askDownload?: boolean | undefined
  format?: ExportFormat | undefined
}

function isStreamDeviceForTare(device: CliDevice): boolean {
  return typeof device.stream === "function" && typeof device.tare === "function"
}

function usesHardwareTare(device: CliDevice): boolean {
  return "usesHardwareTare" in device && (device as { usesHardwareTare?: boolean }).usesHardwareTare === true
}

async function maybeDownloadSessionData(device: CliDevice, ctx: OutputContext, format?: ExportFormat): Promise<void> {
  if (typeof device.download !== "function" || ctx.json) return

  const raw = await input({
    message: "Download session data? [y/N]:",
    default: "n",
  })

  if (!/^y(es)?$/i.test(raw?.trim() ?? "")) return

  const selectedFormat =
    format ??
    (await select({
      message: "Export format:",
      choices: [
        { name: "CSV", value: "csv" as const },
        { name: "JSON", value: "json" as const },
        { name: "XML", value: "xml" as const },
      ],
    }))

  console.log(pc.cyan(`\nExporting ${selectedFormat}...\n`))
  const filePath = await device.download(selectedFormat)
  printSuccess(
    typeof filePath === "string" ? `Data exported to ${filePath}` : `Data exported as ${selectedFormat.toUpperCase()}.`,
  )
}

export async function runLiveDataSession(
  device: CliDevice,
  ctx: OutputContext,
  options: LiveDataOptions = {},
): Promise<void> {
  if (typeof device.stream !== "function") {
    fail("Live Data not supported on this device.")
  }

  const durationMs = options.durationMs
  const indefinite = durationMs == null || durationMs === 0
  const chartEnabled = !ctx.json && process.stdout.isTTY
  const chart = createChartRenderer({ disabled: !chartEnabled, unit: ctx.unit })

  device.notify((data: ForceMeasurement) => {
    if (ctx.json) {
      outputJson(data)
    } else if (chartEnabled) {
      chart.push({ current: data.current, mean: data.mean, peak: data.peak })
    } else {
      console.log(formatMeasurement(data))
    }
  }, ctx.unit)

  if (chartEnabled) chart.start()

  if (indefinite) {
    await device.stream()
    await waitForKeyToStop(ctx.json ? undefined : "Press Esc to stop")
    const stopFn = device.stop
    if (typeof stopFn === "function") await stopFn()
  } else {
    await device.stream(durationMs)
    await device.stop?.()
  }

  if (chartEnabled) chart.stop()
  muteNotify(device)

  if (options.askDownload) {
    await maybeDownloadSessionData(device, ctx, options.format)
  }
}

export async function runTareCalibration(device: CliDevice, duration: number, ctx: OutputContext): Promise<void> {
  if (typeof device.tare !== "function") {
    fail("Tare not supported on this device.")
  }

  if (isStreamDeviceForTare(device)) {
    const streamSpinner = ctx.json ? null : ora("Starting stream for tare...").start()
    const streamFn = device.stream
    if (typeof streamFn === "function") await streamFn(0)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    streamSpinner?.succeed("Stream running.")

    const started = device.tare(duration)
    if (!started) {
      await device.stop?.()
      fail("Tare could not be started (already active?).")
    }

    if (usesHardwareTare(device)) {
      if (!ctx.json) ora().succeed("Tare complete (hardware).")
    } else {
      const spinner = ctx.json ? null : ora(`Tare calibration (${duration / 1000}s). Keep device still...`).start()
      await new Promise((resolve) => setTimeout(resolve, duration))
      spinner?.succeed("Tare calibration complete.")
    }

    await device.stop?.()
    return
  }

  const started = device.tare(duration)
  if (!started) {
    fail("Tare could not be started (already active?).")
  }

  if (usesHardwareTare(device)) {
    if (!ctx.json) ora().succeed("Tare complete (hardware).")
    return
  }

  const spinner = ctx.json ? null : ora(`Tare calibration (${duration / 1000}s). Keep device still...`).start()
  await new Promise((resolve) => setTimeout(resolve, duration))
  spinner?.succeed("Tare calibration complete.")
}

function waitForEnterKey(): Promise<void> {
  if (!process.stdin.isTTY) return Promise.resolve()

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
      if (key.name === "return" || key.name === "enter") cleanup()
    }

    readline.emitKeypressEvents(process.stdin)
    process.stdin.setRawMode?.(true)
    process.stdin.resume()
    process.stdin.on("keypress", onKeypress)
  })
}

function toDisplayUnit(unit: OutputContext["unit"]): string {
  if (unit === "lbs") return "LBS"
  if (unit === "n") return "N"
  return "KG"
}

/**
 * Guided tare flow: show live current and perform tare when Enter is pressed.
 * Falls back to default tare flow in non-interactive contexts.
 */
export async function runGuidedTareCalibration(device: CliDevice, duration: number, ctx: OutputContext): Promise<void> {
  if (ctx.json || !process.stdout.isTTY || !process.stdin.isTTY) {
    await runTareCalibration(device, duration, ctx)
    return
  }

  if (!isStreamDeviceForTare(device)) {
    await runTareCalibration(device, duration, ctx)
    return
  }

  let current = 0
  const unitLabel = toDisplayUnit(ctx.unit)
  let rendered = false

  const renderPrompt = () => {
    if (rendered) process.stdout.write("\x1b[3A\x1b[J")
    process.stdout.write("We're now ready, please tare your device before use.\n")
    process.stdout.write(`${current.toFixed(1)}${unitLabel}\n`)
    process.stdout.write("Press Enter to confirm.\n")
    rendered = true
  }

  device.notify((data: ForceMeasurement) => {
    current = Number.isFinite(data.current) ? data.current : 0
  }, ctx.unit)

  const streamFn = device.stream
  if (typeof streamFn !== "function") {
    await runTareCalibration(device, duration, ctx)
    return
  }

  await streamFn(0)
  renderPrompt()
  const renderInterval = setInterval(renderPrompt, 100)

  try {
    await waitForEnterKey()
  } finally {
    clearInterval(renderInterval)
  }

  const started = device.tare?.(duration)
  if (!started) {
    await device.stop?.()
    fail("Tare could not be started (already active?).")
  }

  if (!usesHardwareTare(device)) {
    await new Promise((resolve) => setTimeout(resolve, duration))
  }

  await device.stop?.()
  muteNotify(device)
  printSuccess("Tare calibration complete.")
}

export async function runDownloadSession(device: CliDevice, format: ExportFormat, ctx: OutputContext): Promise<void> {
  if (typeof device.download !== "function") {
    fail("Download not supported on this device.")
  }

  const filePath = await device.download(format)
  if (!ctx.json) {
    printSuccess(
      typeof filePath === "string"
        ? `Session data exported to ${filePath}`
        : `Session data exported as ${format.toUpperCase()}.`,
    )
  }
}
