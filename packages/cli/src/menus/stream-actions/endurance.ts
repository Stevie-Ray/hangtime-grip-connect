import process from "node:process"
import select from "@inquirer/select"
import pc from "picocolors"
import { createChartRenderer } from "../../chart.js"
import { formatClock } from "../../time.js"
import type { Action, CliDevice, RunOptions } from "../../types.js"
import { muteNotify, outputJson, waitForKeyToStop } from "../../utils.js"
import { measureMvcSides, resolveTargetZone } from "./target-levels.js"
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
  countDownTime: number
  mode: "single" | "bilateral"
  initialSide: "side.left" | "side.right"
  pauseBetweenSides: number
  levelsEnabled: boolean
  leftMvc: number
  rightMvc: number
  restLevel: number
  workLevel: number
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
    countDownTime: Math.max(0, raw?.countDownTime ?? 3),
    mode: raw?.mode === "bilateral" ? "bilateral" : "single",
    initialSide: raw?.initialSide === "side.right" ? "side.right" : "side.left",
    pauseBetweenSides: Math.max(0, raw?.pauseBetweenSides ?? 10),
    levelsEnabled: raw?.levelsEnabled ?? false,
    leftMvc: Math.max(0, raw?.leftMvc ?? 0),
    rightMvc: Math.max(0, raw?.rightMvc ?? 0),
    restLevel: normalizePercent(raw?.restLevel ?? 40),
    workLevel: normalizePercent(raw?.workLevel ?? 80),
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
  const zone = resolveTargetZone(
    {
      plotTargetZone: config.levelsEnabled,
      leftMvcKg: config.leftMvc,
      rightMvcKg: config.rightMvc,
      targetZoneMinPercent: config.restLevel,
      targetZoneMaxPercent: config.workLevel,
      initialSide: config.initialSide,
      pauseBetweenSidesSeconds: config.pauseBetweenSides,
      countdownSeconds: config.countDownTime,
    },
    side,
    ctx.unit,
  )
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
          `Target zone: ${zone.min.toFixed(2)}-${zone.max.toFixed(2)} ${ctx.unit} (${config.restLevel.toFixed(0)}-${config.workLevel.toFixed(0)}% of ${zone.mvcKg.toFixed(2)}kg MVC)`,
        ),
      )
    }
    if (config.countDownTime > 0) {
      await runCountdown(config.countDownTime, chartEnabled ? chart : undefined)
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
    `${t("menu.countdown")}: ${formatClock(config.countDownTime)}`,
    `${t("menu.left-right-mode")}: ${config.mode === "bilateral" ? t("menu.enabled") : t("menu.disabled")}`,
  ]

  if (config.mode === "bilateral") {
    lines.push(
      `${t("menu.start-side-first")}: ${config.initialSide === "side.left" ? t("menu.left") : t("menu.right")}`,
    )
    lines.push(`${t("menu.pause-between-sides")}: ${formatClock(config.pauseBetweenSides)}`)
  }

  lines.push(`${t("menu.plot-target-zone")}: ${config.levelsEnabled ? t("menu.enabled") : t("menu.disabled")}`)
  if (config.levelsEnabled) {
    lines.push(`${t("menu.left-mvc")}: ${config.leftMvc.toFixed(2)} kg`)
    lines.push(`${t("menu.right-mvc")}: ${config.rightMvc.toFixed(2)} kg`)
    lines.push(`${t("menu.target-zone")} range: ${config.restLevel.toFixed(0)}% - ${config.workLevel.toFixed(0)}%`)
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
                  `${t("menu.enable-left-right-mode")}: ${config.mode === "bilateral" ? t("menu.enabled") : t("menu.disabled")}`,
                run: async () => {
                  config.mode =
                    (await select({
                      message: `${t("menu.enable-left-right-mode")}:`,
                      choices: [
                        { name: t("menu.enabled"), value: "bilateral" as const },
                        { name: t("menu.disabled"), value: "single" as const },
                      ],
                      default: config.mode,
                    })) ?? config.mode
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () =>
                  `${t("menu.start-side-first")}: ${config.initialSide === "side.left" ? t("menu.left") : t("menu.right")}`,
                disabled: () => config.mode !== "bilateral",
                run: async () => {
                  config.initialSide = await select({
                    message: t("menu.start-side-first"),
                    choices: [
                      { name: t("menu.left"), value: "side.left" as const },
                      { name: t("menu.right"), value: "side.right" as const },
                    ],
                    default: config.initialSide,
                  })
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => `${t("menu.pause-between-sides")}: ${formatClock(config.pauseBetweenSides)}`,
                disabled: () => config.mode !== "bilateral",
                run: async () => {
                  config.pauseBetweenSides = await promptClockSecondsOption(
                    t("menu.pause-between-sides"),
                    config.pauseBetweenSides,
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
                  `${t("menu.plot-target-zone")}: ${config.levelsEnabled ? t("menu.enabled") : t("menu.disabled")}`,
                run: async () => {
                  config.levelsEnabled =
                    (await select({
                      message: `${t("menu.plot-target-zone")}:`,
                      choices: [
                        { name: t("menu.enabled"), value: true },
                        { name: t("menu.disabled"), value: false },
                      ],
                      default: config.levelsEnabled,
                    })) ?? config.levelsEnabled
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => `${t("menu.left-mvc")}: ${config.leftMvc.toFixed(2)} kg`,
                disabled: () => !config.levelsEnabled,
                run: async () => {
                  config.leftMvc = await promptNumberOption(`${t("menu.left-mvc")} (kg)`, config.leftMvc, 0)
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => `${t("menu.right-mvc")}: ${config.rightMvc.toFixed(2)} kg`,
                disabled: () => !config.levelsEnabled,
                run: async () => {
                  config.rightMvc = await promptNumberOption(`${t("menu.right-mvc")} (kg)`, config.rightMvc, 0)
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => t("menu.measure"),
                disabled: () => !config.levelsEnabled,
                run: async () => {
                  await ensureTaredForStreamAction(device, options)
                  const measured = await measureMvcSides(device, options, {
                    plotTargetZone: config.levelsEnabled,
                    leftMvcKg: config.leftMvc,
                    rightMvcKg: config.rightMvc,
                    targetZoneMinPercent: config.restLevel,
                    targetZoneMaxPercent: config.workLevel,
                    initialSide: config.initialSide,
                    pauseBetweenSidesSeconds: config.pauseBetweenSides,
                    countdownSeconds: config.countDownTime,
                  })
                  config.leftMvc = measured.leftMvcKg
                  config.rightMvc = measured.rightMvcKg
                  writeSessionConfig(options, "endurance", config)

                  console.log(
                    pc.green(
                      `\nMVC updated. Left: ${config.leftMvc.toFixed(2)} kg, Right: ${config.rightMvc.toFixed(2)} kg\n`,
                    ),
                  )
                },
              },
              {
                label: () => `${t("menu.min-target-percent")}: ${config.restLevel.toFixed(0)}%`,
                disabled: () => !config.levelsEnabled,
                run: async () => {
                  config.restLevel = await promptPercentNumber(t("menu.min-target-percent"), config.restLevel)
                  if (config.restLevel > config.workLevel) {
                    config.workLevel = config.restLevel
                  }
                  writeSessionConfig(options, "endurance", config)
                },
              },
              {
                label: () => `${t("menu.max-target-percent")}: ${config.workLevel.toFixed(0)}%`,
                disabled: () => !config.levelsEnabled,
                run: async () => {
                  config.workLevel = await promptPercentNumber(t("menu.max-target-percent"), config.workLevel)
                  if (config.workLevel < config.restLevel) {
                    config.restLevel = config.workLevel
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
              label: () => `${t("menu.countdown")}: ${formatClock(config.countDownTime)}`,
              run: async () => {
                config.countDownTime = await promptClockSecondsOption(t("menu.countdown"), config.countDownTime, 0)
                writeSessionConfig(options, "endurance", config)
              },
            },
            {
              label: () =>
                `${t("menu.enable-left-right-mode")}: ${config.mode === "bilateral" ? t("menu.enabled") : t("menu.disabled")}`,
              run: openModeSubmenu,
            },
            {
              label: () =>
                `${t("menu.plot-target-zone")}: ${
                  config.levelsEnabled
                    ? `${config.restLevel.toFixed(0)}-${config.workLevel.toFixed(0)}%`
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
  const sequence: ("left" | "right" | "single")[] =
    config.mode === "bilateral"
      ? [config.initialSide === "side.left" ? "left" : "right", config.initialSide === "side.left" ? "right" : "left"]
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

    if (i < sequence.length - 1 && config.pauseBetweenSides > 0 && !ctx.json) {
      console.log(pc.dim(`\n${t("menu.pause-between-sides")}: ${formatClock(config.pauseBetweenSides)}`))
      await new Promise((resolve) => setTimeout(resolve, config.pauseBetweenSides * 1000))
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
        countDownTime: config.countDownTime,
        mode: config.mode,
        initialSide: config.initialSide,
        pauseBetweenSides: config.pauseBetweenSides,
        targetZone: config.levelsEnabled
          ? {
              leftMvc: +config.leftMvc.toFixed(2),
              rightMvc: +config.rightMvc.toFixed(2),
              minPercent: +config.restLevel.toFixed(0),
              maxPercent: +config.workLevel.toFixed(0),
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
    if (config.levelsEnabled) {
      console.log(
        pc.dim(
          `  ${t("menu.in-zone")}: ${item.inZoneSeconds.toFixed(2)}s (${item.inZonePercent.toFixed(1)}%) | ${t("menu.below")}: ${item.belowZoneSeconds.toFixed(2)}s | ${t("menu.above")}: ${item.aboveZoneSeconds.toFixed(2)}s`,
        ),
      )
    }
  }

  const headline =
    config.mode === "bilateral"
      ? `Endurance L/R mean ${summary.map((s) => `${s.side}:${s.mean.toFixed(2)}`).join(" | ")} ${ctx.unit}`
      : `Endurance mean ${summary[0]?.mean.toFixed(2) ?? "0.00"} ${ctx.unit}`

  await promptSaveMeasurement("endurance", "Endurance", options, {
    headline,
    details: [
      `${t("menu.duration")}: ${formatClock(config.durationSeconds)}`,
      `${t("menu.countdown")}: ${formatClock(config.countDownTime)}`,
      `${t("menu.left-right-mode")}: ${config.mode === "bilateral" ? t("menu.enabled") : t("menu.disabled")}`,
      ...(config.mode === "bilateral"
        ? [`${t("menu.start-side-first")}: ${config.initialSide === "side.left" ? t("menu.left") : t("menu.right")}`]
        : []),
      ...(config.levelsEnabled
        ? [
            `${t("menu.target-zone")}: ${config.restLevel.toFixed(0)}-${config.workLevel.toFixed(0)}% of MVC`,
            `${t("menu.left-mvc")}: ${config.leftMvc.toFixed(2)} kg`,
            `${t("menu.right-mvc")}: ${config.rightMvc.toFixed(2)} kg`,
          ]
        : []),
    ],
    data: {
      cancelled,
      config: {
        durationSeconds: config.durationSeconds,
        countDownTime: config.countDownTime,
        mode: config.mode,
        initialSide: config.initialSide,
        pauseBetweenSides: config.pauseBetweenSides,
        levelsEnabled: config.levelsEnabled,
        leftMvc: +config.leftMvc.toFixed(2),
        rightMvc: +config.rightMvc.toFixed(2),
        restLevel: +config.restLevel.toFixed(0),
        workLevel: +config.workLevel.toFixed(0),
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
