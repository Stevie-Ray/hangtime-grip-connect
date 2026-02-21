import input from "@inquirer/input"
import select from "@inquirer/select"
import pc from "picocolors"
import type { CliDevice, OutputContext, RunOptions } from "../../types.js"
import type { MeasurementTestKey } from "../../services/measurements.js"
import { listMeasurementRecords, saveMeasurementRecord } from "../../services/measurements.js"
import { runGuidedTareCalibration } from "../../services/session.js"

export interface StreamActionStartOptions {
  onConfigureOptions?: () => Promise<void>
  getOptionsLabel?: () => string
  onViewMeasurements?: () => Promise<void>
  getMeasurementsLabel?: () => string
}

export interface StreamActionOptionItem {
  label: () => string
  run: () => Promise<void>
  disabled?: () => boolean
}

export async function promptStreamActionStart(
  ctx: OutputContext | undefined,
  options?: StreamActionStartOptions,
): Promise<boolean> {
  if (ctx?.json) return true
  while (true) {
    const sessionAction = await select({
      message: "Pick an option:",
      choices: [
        { name: "Start Session", value: "start" as const },
        ...(options?.onConfigureOptions
          ? [{ name: options.getOptionsLabel?.() ?? "Options", value: "options" as const }]
          : []),
        ...(options?.onViewMeasurements
          ? [{ name: options.getMeasurementsLabel?.() ?? "Measurements", value: "measurements" as const }]
          : []),
        { name: "Go Back", value: "return" as const },
      ],
    })

    if (sessionAction === "start") return true
    if (sessionAction === "return") return false
    if (sessionAction === "options") {
      await options?.onConfigureOptions?.()
      continue
    }
    await options?.onViewMeasurements?.()
  }
}

export async function ensureTaredForStreamAction(device: CliDevice, options: RunOptions): Promise<void> {
  const sessionState = options.sessionState
  if (!sessionState || sessionState.isTared) return
  if (typeof device.tare !== "function") return

  const outCtx = options.ctx ?? { json: false, unit: "kg" as const }
  if (!outCtx.json) {
    console.log(pc.dim("\nTare required. Running tare first..."))
  }
  await runGuidedTareCalibration(device, 1000, outCtx)
  sessionState.isTared = true
}

export async function runPlaceholderSession(
  title: string,
  body: string,
  _device: CliDevice,
  options: RunOptions,
  startOptions?: StreamActionStartOptions,
  renderOptionSummary?: () => string[],
): Promise<void> {
  if (options.ctx?.json) return

  console.log(pc.cyan(`\n${title}\n`) + pc.dim("─".repeat(60) + "\n") + body)
  const shouldStart = await promptStreamActionStart(options.ctx, startOptions)
  if (!shouldStart) return
  const summary = renderOptionSummary?.() ?? []
  if (summary.length > 0) {
    console.log(pc.dim("\nSelected options:"))
    for (const line of summary) {
      console.log(pc.dim(`- ${line}`))
    }
  }
  console.log(pc.dim("\nThis test is not implemented yet.\n"))
}

export async function promptStreamActionOptionsMenu(title: string, items: StreamActionOptionItem[]): Promise<void> {
  if (items.length === 0) return

  while (true) {
    const selected = await select({
      message: `${title} options:`,
      choices: [
        ...items.map((item, index) => ({
          name: item.label(),
          value: index,
          ...(item.disabled?.()
            ? {
                disabled: true,
              }
            : {}),
        })),
        { name: "Back", value: -1 },
      ],
    })
    if (selected === -1) return
    const item = items[selected]
    if (!item) continue
    await item.run()
  }
}

export async function promptIntegerSecondsOption(
  label: string,
  currentSeconds: number,
  minimumSeconds = 0,
): Promise<number> {
  const raw = await input({
    message: `${label} (seconds):`,
    default: currentSeconds.toString(),
  })
  const next = Math.trunc(Number(raw.trim()))
  if (!Number.isFinite(next)) return currentSeconds
  return Math.max(minimumSeconds, next)
}

export async function viewSavedMeasurements(testKey: MeasurementTestKey, title: string): Promise<void> {
  const records = await listMeasurementRecords(testKey)
  if (records.length === 0) {
    console.log(pc.dim(`\nNo saved measurements for ${title} yet.\n`))
    return
  }

  while (true) {
    const selected = await select({
      message: `${title} measurements:`,
      choices: [
        ...records.map((record) => ({
          name: `${new Date(record.createdAt).toLocaleString()} - ${record.headline}`,
          value: record.id,
        })),
        { name: "Back", value: "__back" },
      ],
    })

    if (selected === "__back") return
    const record = records.find((item) => item.id === selected)
    if (!record) continue
    console.log(pc.cyan(`\n${record.testName} measurement\n`))
    console.log(pc.dim(`Date: ${new Date(record.createdAt).toLocaleString()}`))
    console.log(pc.bold(record.headline))
    for (const line of record.details) {
      console.log(pc.dim(`- ${line}`))
    }
    await input({ message: "Press Enter to continue", default: "" })
  }
}

export async function promptSaveMeasurement(
  testKey: MeasurementTestKey,
  testName: string,
  options: RunOptions,
  payload: {
    headline: string
    details?: string[]
    data: Record<string, unknown>
  },
): Promise<void> {
  if (options.ctx?.json) return
  const raw = await input({
    message: "Save measurement? [y/N]:",
    default: "n",
  })
  if (!/^y(es)?$/i.test(raw?.trim() ?? "")) return

  await saveMeasurementRecord({
    testKey,
    testName,
    headline: payload.headline,
    details: payload.details ?? [],
    data: payload.data,
    ...(options.ctx?.unit ? { unit: options.ctx.unit } : {}),
  })
  console.log(pc.green("\nMeasurement saved.\n"))
}
