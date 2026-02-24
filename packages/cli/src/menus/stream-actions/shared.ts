import input from "@inquirer/input"
import select from "@inquirer/select"
import pc from "picocolors"
import { formatClock, parseSecondsLikeInput } from "../../time.js"
import type { CliDevice, OutputContext, RunOptions, SessionRunOptions } from "../../types.js"
import type { MeasurementTestKey } from "../../services/measurements.js"
import { listMeasurementRecords, saveMeasurementRecord } from "../../services/measurements.js"
import { runGuidedTareCalibration } from "../../services/session.js"
import { setTranslationLanguage, t } from "../interactive/translations.js"

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

interface CountdownRenderer {
  setStatus(status: string): void
}

export function readSessionConfig<K extends keyof SessionRunOptions>(
  options: RunOptions,
  key: K,
): SessionRunOptions[K] | undefined {
  return options.session?.[key]
}

export function writeSessionConfig<K extends keyof SessionRunOptions>(
  options: RunOptions,
  key: K,
  value: NonNullable<SessionRunOptions[K]>,
): void {
  options.session = {
    ...(options.session ?? {}),
    [key]: {
      ...(options.session?.[key] ?? {}),
      ...value,
    } as SessionRunOptions[K],
  }
}

export async function promptStreamActionStart(
  ctx: OutputContext | undefined,
  options?: StreamActionStartOptions,
): Promise<boolean> {
  if (ctx?.json) return true
  const language = ctx?.language ?? "en"
  setTranslationLanguage(language)
  while (true) {
    const sessionAction = await select({
      message: t("menu.pick-option"),
      choices: [
        { name: t("menu.start-session"), value: "start" as const },
        ...(options?.onConfigureOptions
          ? [{ name: options.getOptionsLabel?.() ?? t("menu.options"), value: "options" as const }]
          : []),
        ...(options?.onViewMeasurements
          ? [
              {
                name: options.getMeasurementsLabel?.() ?? t("menu.measurements"),
                value: "measurements" as const,
              },
            ]
          : []),
        { name: t("menu.go-back"), value: "return" as const },
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

  const outCtx = options.ctx ?? { json: false, unit: "kg" as const, language: "en" as const }
  setTranslationLanguage(outCtx.language)
  if (!outCtx.json) {
    console.log(pc.dim(`\n${t("menu.tare-required-running-first")}`))
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
    console.log(pc.dim(`\n${t("menu.selected-options")}`))
    for (const line of summary) {
      console.log(pc.dim(`- ${line}`))
    }
  }
  console.log(pc.dim(`\n${t("menu.this-test-not-implemented")}\n`))
}

export async function promptStreamActionOptionsMenu(
  title: string,
  items: StreamActionOptionItem[],
  language: OutputContext["language"] = "en",
): Promise<void> {
  if (items.length === 0) return
  setTranslationLanguage(language)

  while (true) {
    const selected = await select({
      message: `${title} ${t("menu.options").toLowerCase()}:`,
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
        { name: t("menu.back"), value: -1 },
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
    message: `${label} (mm:ss or seconds):`,
    default: currentSeconds.toString(),
  })
  try {
    const next = parseSecondsLikeInput(raw, label)
    return Math.max(minimumSeconds, Math.trunc(next))
  } catch {
    return currentSeconds
  }
}

export async function promptNumberOption(
  label: string,
  currentValue: number,
  minimum = 0,
  maximum = Number.POSITIVE_INFINITY,
): Promise<number> {
  const raw = await input({
    message: `${label}:`,
    default: currentValue.toString(),
  })
  const parsed = Number.parseFloat(raw.trim())
  if (!Number.isFinite(parsed)) return currentValue
  return Math.min(maximum, Math.max(minimum, parsed))
}

export async function promptPercentOption(label: string, currentValue: number): Promise<number> {
  return promptNumberOption(label, currentValue, 0, 100)
}

export async function promptClockSecondsOption(
  label: string,
  currentSeconds: number,
  minimumSeconds = 0,
): Promise<number> {
  const raw = await input({
    message: `${label} (mm:ss or seconds):`,
    default: formatClock(currentSeconds),
  })
  try {
    const next = parseSecondsLikeInput(raw, label)
    return Math.max(minimumSeconds, Math.trunc(next))
  } catch {
    return currentSeconds
  }
}

export async function runCountdown(seconds: number, renderer?: CountdownRenderer): Promise<void> {
  for (let i = Math.max(0, Math.trunc(seconds)); i >= 1; i--) {
    const status = t("menu.countdown-status", { time: formatClock(i) })
    if (renderer) renderer.setStatus(status)
    else console.log(pc.bold(status))
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  if (renderer) renderer.setStatus("")
}

export async function viewSavedMeasurements(
  testKey: MeasurementTestKey,
  title: string,
  language: OutputContext["language"] = "en",
): Promise<void> {
  setTranslationLanguage(language)
  const records = await listMeasurementRecords(testKey)
  if (records.length === 0) {
    console.log(pc.dim(`\n${t("menu.no-saved-measurements-yet", { title })}\n`))
    return
  }

  while (true) {
    const selected = await select({
      message: t("menu.measurements-for-title", { title }),
      choices: [
        ...records.map((record) => ({
          name: `${new Date(record.createdAt).toLocaleString()} - ${record.headline}`,
          value: record.id,
        })),
        { name: t("menu.back"), value: "__back" },
      ],
    })

    if (selected === "__back") return
    const record = records.find((item) => item.id === selected)
    if (!record) continue
    console.log(pc.cyan(`\n${t("menu.measurement-record-title", { testName: record.testName })}\n`))
    console.log(pc.dim(`${t("menu.date")}: ${new Date(record.createdAt).toLocaleString()}`))
    console.log(pc.bold(record.headline))
    for (const line of record.details) {
      console.log(pc.dim(`- ${line}`))
    }
    await input({ message: t("menu.press-enter-to-continue"), default: "" })
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
    message: t("menu.save-measurement-prompt"),
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
  console.log(pc.green(`\n${t("menu.measurement-saved")}\n`))
}
