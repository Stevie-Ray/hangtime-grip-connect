import process from "node:process"
import select from "@inquirer/select"
import pc from "picocolors"
import { createChartRenderer } from "../../chart.js"
import { formatClock } from "../../time.js"
import type { Action, CliDevice, RunOptions } from "../../types.js"
import { muteNotify, outputJson, waitForKeyToStop } from "../../utils.js"
import { measureMvcSides, resolveTargetZone, type TargetLevelsConfig } from "./target-levels.js"
import { setTranslationLanguage, t } from "../interactive/translations.js"
import {
  ensureTaredForStreamAction,
  promptClockSecondsOption,
  promptNumberOption,
  promptPercentOption,
  promptSaveMeasurement,
  readSessionConfig,
  runCountdown,
  promptStreamActionOptionsMenu,
  promptStreamActionStart,
  viewSavedMeasurements,
  writeSessionConfig,
} from "./shared.js"

interface EnduranceConfig {
  durationSeconds: number
  countdownSeconds: number
  leftRightMode: boolean
  startSide: "left" | "right"
  pauseBetweenSidesSeconds: number
  plotTargetZone: boolean
  leftMvcKg: number
  rightMvcKg: number
  targetZoneMinPercent: number
  targetZoneMaxPercent: number
}

interface EnduranceCaptureResult {
  side: "left" | "right" | "single"
  label: "Left" | "Right" | "Single"
  peak: number
  mean: number
  inZoneSeconds: number
  belowZoneSeconds: number
  aboveZoneSeconds: number
}

function normalizePercent(value: number, minimum = 0, maximum = 100): number {
  return Math.min(maximum, Math.max(minimum, value))
}

function normalizeEnduranceConfig(options: RunOptions): EnduranceConfig {
  const raw = readSessionConfig(options, "endurance")
  return {
    durationSeconds: Math.max(1, raw?.durationSeconds ?? 30),
    countdownSeconds: Math.max(0, raw?.countdownSeconds ?? 3),
    leftRightMode: raw?.leftRightMode ?? false,
    startSide: raw?.startSide === "right" ? "right" : "left",
    pauseBetweenSidesSeconds: Math.max(0, raw?.pauseBetweenSidesSeconds ?? 10),
    plotTargetZone: raw?.plotTargetZone ?? false,
    leftMvcKg: Math.max(0, raw?.leftMvcKg ?? 0),
    rightMvcKg: Math.max(0, raw?.rightMvcKg ?? 0),
    targetZoneMinPercent: normalizePercent(raw?.targetZoneMinPercent ?? 40),
    targetZoneMaxPercent: normalizePercent(raw?.targetZoneMaxPercent ?? 80),
  }
}

async function promptPercentNumber(message: string, current: number): Promise<number> {
  const next = await promptPercentOption(message, current)
  return normalizePercent(next)
}

async function runEnduranceCapture(
  device: CliDevice,
  options: RunOptions,
  config: EnduranceConfig,
  side: "left" | "right" | "single",
): Promise<{ result?: EnduranceCaptureResult; cancelled: boolean }> {
  const ctx = options.ctx ?? { json: false, unit: "kg" as const, language: "en" as const }
  const label: EnduranceCaptureResult["label"] = side === "left" ? "Left" : side === "right" ? "Right" : "Single"
  const displayLabel = side === "left" ? t("menu.left") : side === "right" ? t("menu.right") : t("menu.single")
  const enduranceName = t("actions.endurance.name")
  const zone = resolveTargetZone(config, side, ctx.unit)
  const chartEnabled = !ctx.json && process.stdout.isTTY
  const chart = createChartRenderer({ disabled: !chartEnabled, unit: ctx.unit, dimStatus: false })
  const durationMs = config.durationSeconds * 1000

  let peak = 0
  let sum = 0
  let samples = 0
  let inZoneSeconds = 0
  let belowZoneSeconds = 0
  let aboveZoneSeconds = 0
  let lastTs: number | undefined
  let lastForce = 0
  let cancelled = false
  let statusInterval: ReturnType<typeof setInterval> | undefined

  const classify = (force: number): "below" | "in" | "above" | "none" => {
    if (!zone) return "none"
    if (force < zone.min) return "below"
    if (force > zone.max) return "above"
    return "in"
  }

  device.notify((data) => {
    const now = Date.now()
    const force = Number.isFinite(data.current) ? Math.max(0, data.current) : 0
    if (force > peak) peak = force
    sum += force
    samples++
    if (chartEnabled) chart.push({ current: data.current, mean: data.mean, peak: data.peak })
    if (ctx.json) outputJson({ ...data, test: "endurance", side: label.toLowerCase() })

    if (lastTs != null && zone) {
      const dt = Math.max(0, now - lastTs) / 1000
      const band = classify(lastForce)
      if (band === "in") inZoneSeconds += dt
      if (band === "below") belowZoneSeconds += dt
      if (band === "above") aboveZoneSeconds += dt
    }

    lastTs = now
    lastForce = force
  }, ctx.unit)

  if (chartEnabled) {
    chart.start()
    chart.push({ current: 0, mean: 0, peak: 0 })
  }

  if (!ctx.json) {
    console.log(pc.dim(`\n${displayLabel} ${enduranceName.toLowerCase()} (${formatClock(config.durationSeconds)})`))
    if (zone) {
      console.log(
        pc.dim(
          `Target zone: ${zone.min.toFixed(2)}-${zone.max.toFixed(2)} ${ctx.unit} (${config.targetZoneMinPercent.toFixed(0)}-${config.targetZoneMaxPercent.toFixed(0)}% of ${zone.mvcKg.toFixed(2)}kg MVC)`,
        ),
      )
    }
    if (config.countdownSeconds > 0) {
      await runCountdown(config.countdownSeconds, chartEnabled ? chart : undefined)
    }
  }

  try {
    const captureStartedAt = Date.now()
    const streamPromise = device.stream?.(durationMs) ?? Promise.resolve()
    void streamPromise.catch(() => undefined)
    statusInterval = chartEnabled
      ? setInterval(() => {
          const elapsedMs = Math.max(0, Date.now() - captureStartedAt)
          const elapsedSeconds = Math.min(config.durationSeconds, Math.floor(elapsedMs / 1000))
          const remainingSeconds = Math.max(0, config.durationSeconds - elapsedSeconds)
          chart.setStatus(
            `${displayLabel} ${enduranceName.toLowerCase()} ${formatClock(elapsedSeconds)} / ${formatClock(config.durationSeconds)} (${t(
              "menu.remaining",
            )} ${formatClock(remainingSeconds)}) · ${t("menu.press-esc-to-stop")}`,
          )
        }, 100)
      : undefined

    if (!ctx.json && process.stdin.isTTY) {
      const stopPromise = waitForKeyToStop()
      const state = await Promise.race([
        streamPromise.then(() => "done" as const),
        stopPromise.then(() => "stop" as const),
      ])
      if (state === "stop") {
        cancelled = true
        await device.stop?.()
      } else {
        await device.stop?.()
      }
    } else {
      await streamPromise
      await device.stop?.()
    }
  } finally {
    if (statusInterval) clearInterval(statusInterval)
    if (chartEnabled) chart.stop()
    muteNotify(device)
  }

  if (cancelled || samples === 0) return { cancelled }

  const mean = sum / Math.max(1, samples)
  return {
    cancelled: false,
    result: {
      side,
      label,
      peak,
      mean,
      inZoneSeconds,
      belowZoneSeconds,
      aboveZoneSeconds,
    },
  }
}

function describeOptions(config: EnduranceConfig, t: (key: string) => string): string[] {
  const lines: string[] = [
    `${t("menu.duration")}: ${formatClock(config.durationSeconds)}`,
    `${t("menu.countdown")}: ${formatClock(config.countdownSeconds)}`,
    `${t("menu.left-right-mode")}: ${config.leftRightMode ? t("menu.enabled") : t("menu.disabled")}`,
  ]

  if (config.leftRightMode) {
    lines.push(`${t("menu.start-side-first")}: ${config.startSide === "left" ? t("menu.left") : t("menu.right")}`)
    lines.push(`${t("menu.pause-between-sides")}: ${formatClock(config.pauseBetweenSidesSeconds)}`)
  }

  lines.push(`${t("menu.plot-target-zone")}: ${config.plotTargetZone ? t("menu.enabled") : t("menu.disabled")}`)
  if (config.plotTargetZone) {
    lines.push(`${t("menu.left-mvc")}: ${config.leftMvcKg.toFixed(2)} kg`)
    lines.push(`${t("menu.right-mvc")}: ${config.rightMvcKg.toFixed(2)} kg`)
    lines.push(
      `${t("menu.target-zone")} range: ${config.targetZoneMinPercent.toFixed(0)}% - ${config.targetZoneMaxPercent.toFixed(0)}%`,
    )
  }

  return lines
}

export async function runEnduranceAction(device: CliDevice, options: RunOptions): Promise<void> {
  const ctx = options.ctx ?? { json: false, unit: "kg" as const, language: "en" as const }
  setTranslationLanguage(ctx.language)
  const enduranceLabel = t("actions.endurance.name")
  if (typeof device.stream !== "function") return

  const config = normalizeEnduranceConfig(options)
  writeSessionConfig(options, "endurance", config)

  if (!ctx.json && !options.nonInteractive) {
    console.log(pc.cyan("\nEndurance\n") + pc.dim("─".repeat(60) + "\n"))
    const shouldStart = await promptStreamActionStart(ctx, {
      onConfigureOptions: async () => {
        const openModeSubmenu = async (): Promise<void> => {
          await promptStreamActionOptionsMenu(
            `${enduranceLabel} ${t("menu.left-right")}`,
            [
              {
                label: () =>
                  `${t("menu.enable-left-right-mode")}: ${config.leftRightMode ? t("menu.enabled") : t("menu.disabled")}`,
                run: async () => {
                  config.leftRightMode =
                    (await select({
                      message: `${t("menu.enable-left-right-mode")}:`,
                      choices: [
                        { name: t("menu.enabled"), value: true },
                        { name: t("menu.disabled"), value: false },
                      ],
                      default: config.leftRightMode,
                    })) ?? config.leftRightMode
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () =>
                  `${t("menu.start-side-first")}: ${config.startSide === "left" ? t("menu.left") : t("menu.right")}`,
                disabled: () => !config.leftRightMode,
                run: async () => {
                  config.startSide = await select({
                    message: t("menu.start-side-first"),
                    choices: [
                      { name: t("menu.left"), value: "left" as const },
                      { name: t("menu.right"), value: "right" as const },
                    ],
                    default: config.startSide,
                  })
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => `${t("menu.pause-between-sides")}: ${formatClock(config.pauseBetweenSidesSeconds)}`,
                disabled: () => !config.leftRightMode,
                run: async () => {
                  config.pauseBetweenSidesSeconds = await promptClockSecondsOption(
                    t("menu.pause-between-sides"),
                    config.pauseBetweenSidesSeconds,
                    0,
                  )
                  writeSessionConfig(options, "endurance", config)
                },
              },
            ],
            ctx.language,
          )
        }

        const openTargetZoneSubmenu = async (): Promise<void> => {
          await promptStreamActionOptionsMenu(
            `${enduranceLabel} ${t("menu.target-zone")}`,
            [
              {
                label: () =>
                  `${t("menu.plot-target-zone")}: ${config.plotTargetZone ? t("menu.enabled") : t("menu.disabled")}`,
                run: async () => {
                  config.plotTargetZone =
                    (await select({
                      message: `${t("menu.plot-target-zone")}:`,
                      choices: [
                        { name: t("menu.enabled"), value: true },
                        { name: t("menu.disabled"), value: false },
                      ],
                      default: config.plotTargetZone,
                    })) ?? config.plotTargetZone
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => `${t("menu.left-mvc")}: ${config.leftMvcKg.toFixed(2)} kg`,
                disabled: () => !config.plotTargetZone,
                run: async () => {
                  config.leftMvcKg = await promptNumberOption(`${t("menu.left-mvc")} (kg)`, config.leftMvcKg, 0)
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => `${t("menu.right-mvc")}: ${config.rightMvcKg.toFixed(2)} kg`,
                disabled: () => !config.plotTargetZone,
                run: async () => {
                  config.rightMvcKg = await promptNumberOption(`${t("menu.right-mvc")} (kg)`, config.rightMvcKg, 0)
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => t("menu.measure"),
                disabled: () => !config.plotTargetZone,
                run: async () => {
                  await ensureTaredForStreamAction(device, options)
                  const measured = await measureMvcSides(device, options, config as TargetLevelsConfig)
                  config.leftMvcKg = measured.leftMvcKg
                  config.rightMvcKg = measured.rightMvcKg
                  writeSessionConfig(options, "endurance", config)

                  console.log(
                    pc.green(
                      `\nMVC updated. Left: ${config.leftMvcKg.toFixed(2)} kg, Right: ${config.rightMvcKg.toFixed(2)} kg\n`,
                    ),
                  )
                },
              },
              {
                label: () => `${t("menu.min-target-percent")}: ${config.targetZoneMinPercent.toFixed(0)}%`,
                disabled: () => !config.plotTargetZone,
                run: async () => {
                  config.targetZoneMinPercent = await promptPercentNumber(
                    t("menu.min-target-percent"),
                    config.targetZoneMinPercent,
                  )
                  if (config.targetZoneMinPercent > config.targetZoneMaxPercent) {
                    config.targetZoneMaxPercent = config.targetZoneMinPercent
                  }
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => `${t("menu.max-target-percent")}: ${config.targetZoneMaxPercent.toFixed(0)}%`,
                disabled: () => !config.plotTargetZone,
                run: async () => {
                  config.targetZoneMaxPercent = await promptPercentNumber(
                    t("menu.max-target-percent"),
                    config.targetZoneMaxPercent,
                  )
                  if (config.targetZoneMaxPercent < config.targetZoneMinPercent) {
                    config.targetZoneMinPercent = config.targetZoneMaxPercent
                  }
                  writeSessionConfig(options, "endurance", config)
                },
              },
            ],
            ctx.language,
          )
        }

        await promptStreamActionOptionsMenu(
          enduranceLabel,
          [
            {
              label: () => `${t("menu.duration")}: ${formatClock(config.durationSeconds)}`,
              run: async () => {
                config.durationSeconds = await promptClockSecondsOption(t("menu.duration"), config.durationSeconds, 1)
                writeSessionConfig(options, "endurance", config)
              },
            },
            {
              label: () => `${t("menu.countdown")}: ${formatClock(config.countdownSeconds)}`,
              run: async () => {
                config.countdownSeconds = await promptClockSecondsOption(
                  t("menu.countdown"),
                  config.countdownSeconds,
                  0,
                )
                writeSessionConfig(options, "endurance", config)
              },
            },
            {
              label: () =>
                `${t("menu.enable-left-right-mode")}: ${config.leftRightMode ? t("menu.enabled") : t("menu.disabled")}`,
              run: openModeSubmenu,
            },
            {
              label: () =>
                `${t("menu.plot-target-zone")}: ${
                  config.plotTargetZone
                    ? `${config.targetZoneMinPercent.toFixed(0)}-${config.targetZoneMaxPercent.toFixed(0)}%`
                    : t("menu.disabled")
                }`,
              run: openTargetZoneSubmenu,
            },
          ],
          ctx.language,
        )
      },
      getOptionsLabel: () => `${t("menu.options")} (${describeOptions(config, t).join(", ")})`,
      onViewMeasurements: async () => viewSavedMeasurements("endurance", enduranceLabel, ctx.language),
    })
    if (!shouldStart) return
  }

  await ensureTaredForStreamAction(device, options)
  const sequence: ("left" | "right" | "single")[] = config.leftRightMode
    ? [config.startSide, config.startSide === "left" ? "right" : "left"]
    : ["single"]

  const results: EnduranceCaptureResult[] = []
  let cancelled = false
  for (let i = 0; i < sequence.length; i++) {
    const side = sequence[i]
    const capture = await runEnduranceCapture(device, options, config, side)
    if (capture.cancelled) {
      cancelled = true
      break
    }
    if (capture.result) results.push(capture.result)

    if (i < sequence.length - 1 && config.pauseBetweenSidesSeconds > 0 && !ctx.json) {
      console.log(pc.dim(`\n${t("menu.pause-between-sides")}: ${formatClock(config.pauseBetweenSidesSeconds)}`))
      await new Promise((resolve) => setTimeout(resolve, config.pauseBetweenSidesSeconds * 1000))
    }
  }

  if (results.length === 0) {
    if (!ctx.json) console.log(pc.dim(`\n${t("menu.endurance-stopped")}`))
    return
  }

  const summary = results.map((result) => {
    const totalTracked = result.inZoneSeconds + result.belowZoneSeconds + result.aboveZoneSeconds
    const inZonePct = totalTracked > 0 ? (result.inZoneSeconds / totalTracked) * 100 : 0
    return {
      side: result.side,
      peak: +result.peak.toFixed(2),
      mean: +result.mean.toFixed(2),
      inZoneSeconds: +result.inZoneSeconds.toFixed(2),
      inZonePercent: +inZonePct.toFixed(1),
      belowZoneSeconds: +result.belowZoneSeconds.toFixed(2),
      aboveZoneSeconds: +result.aboveZoneSeconds.toFixed(2),
    }
  })

  if (ctx.json) {
    outputJson({
      summary: {
        test: "endurance",
        cancelled,
        durationSeconds: config.durationSeconds,
        countdownSeconds: config.countdownSeconds,
        leftRightMode: config.leftRightMode,
        startSide: config.startSide,
        pauseBetweenSidesSeconds: config.pauseBetweenSidesSeconds,
        targetZone: config.plotTargetZone
          ? {
              leftMvcKg: +config.leftMvcKg.toFixed(2),
              rightMvcKg: +config.rightMvcKg.toFixed(2),
              minPercent: +config.targetZoneMinPercent.toFixed(0),
              maxPercent: +config.targetZoneMaxPercent.toFixed(0),
            }
          : undefined,
        results: summary,
        unit: ctx.unit,
      },
    })
    return
  }

  console.log(pc.cyan(`\n${t("menu.endurance-results")}\n`))
  for (const item of summary) {
    console.log(
      `${pc.bold(item.side.toUpperCase())}: ${t("menu.peak").toLowerCase()} ${item.peak.toFixed(2)} ${ctx.unit}, ${t("menu.mean").toLowerCase()} ${item.mean.toFixed(2)} ${ctx.unit}`,
    )
    if (config.plotTargetZone) {
      console.log(
        pc.dim(
          `  ${t("menu.in-zone")}: ${item.inZoneSeconds.toFixed(2)}s (${item.inZonePercent.toFixed(1)}%) | ${t("menu.below")}: ${item.belowZoneSeconds.toFixed(2)}s | ${t("menu.above")}: ${item.aboveZoneSeconds.toFixed(2)}s`,
        ),
      )
    }
  }

  const headline = config.leftRightMode
    ? `Endurance L/R mean ${summary.map((s) => `${s.side}:${s.mean.toFixed(2)}`).join(" | ")} ${ctx.unit}`
    : `Endurance mean ${summary[0]?.mean.toFixed(2) ?? "0.00"} ${ctx.unit}`

  await promptSaveMeasurement("endurance", "Endurance", options, {
    headline,
    details: [
      `${t("menu.duration")}: ${formatClock(config.durationSeconds)}`,
      `${t("menu.countdown")}: ${formatClock(config.countdownSeconds)}`,
      `${t("menu.left-right-mode")}: ${config.leftRightMode ? t("menu.enabled") : t("menu.disabled")}`,
      ...(config.leftRightMode
        ? [`${t("menu.start-side-first")}: ${config.startSide === "left" ? t("menu.left") : t("menu.right")}`]
        : []),
      ...(config.plotTargetZone
        ? [
            `${t("menu.target-zone")}: ${config.targetZoneMinPercent.toFixed(0)}-${config.targetZoneMaxPercent.toFixed(0)}% of MVC`,
            `${t("menu.left-mvc")}: ${config.leftMvcKg.toFixed(2)} kg`,
            `${t("menu.right-mvc")}: ${config.rightMvcKg.toFixed(2)} kg`,
          ]
        : []),
    ],
    data: {
      cancelled,
      config: {
        durationSeconds: config.durationSeconds,
        countdownSeconds: config.countdownSeconds,
        leftRightMode: config.leftRightMode,
        startSide: config.startSide,
        pauseBetweenSidesSeconds: config.pauseBetweenSidesSeconds,
        plotTargetZone: config.plotTargetZone,
        leftMvcKg: +config.leftMvcKg.toFixed(2),
        rightMvcKg: +config.rightMvcKg.toFixed(2),
        targetZoneMinPercent: +config.targetZoneMinPercent.toFixed(0),
        targetZoneMaxPercent: +config.targetZoneMaxPercent.toFixed(0),
      },
      results: summary,
      unit: ctx.unit,
    },
  })
}

export function buildEnduranceAction(): Action {
  return {
    actionId: "endurance",
    name: "Endurance",
    description: "Record data for a given duration.",
    run: async (device: CliDevice, options: RunOptions) => runEnduranceAction(device, options),
  }
}
