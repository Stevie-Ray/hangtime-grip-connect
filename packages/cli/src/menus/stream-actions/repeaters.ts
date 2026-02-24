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

interface RepeatersConfig {
  sets: number
  repsPerSet: number
  workSeconds: number
  restSeconds: number
  pauseSeconds: number
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

interface RepeatersResult {
  side: "left" | "right" | "single"
  label: "Left" | "Right" | "Single"
  peak: number
  meanWork: number
  inZoneSeconds: number
  belowZoneSeconds: number
  aboveZoneSeconds: number
}

type PhaseType = "work" | "rest" | "pause"

interface TimelinePhase {
  type: PhaseType
  setIndex: number
  repIndex: number
  startSecond: number
  endSecond: number
}

function normalizePercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

function normalizeRepeatersConfig(options: RunOptions): RepeatersConfig {
  const raw = readSessionConfig(options, "repeaters")
  return {
    sets: Math.max(1, Math.trunc(raw?.sets ?? 3)),
    repsPerSet: Math.max(1, Math.trunc(raw?.repsPerSet ?? 12)),
    workSeconds: Math.max(1, Math.trunc(raw?.workSeconds ?? 10)),
    restSeconds: Math.max(0, Math.trunc(raw?.restSeconds ?? 6)),
    pauseSeconds: Math.max(0, Math.trunc(raw?.pauseSeconds ?? 8 * 60)),
    countdownSeconds: Math.max(0, Math.trunc(raw?.countdownSeconds ?? 3)),
    leftRightMode: raw?.leftRightMode ?? false,
    startSide: raw?.startSide === "right" ? "right" : "left",
    pauseBetweenSidesSeconds: Math.max(0, Math.trunc(raw?.pauseBetweenSidesSeconds ?? 10)),
    plotTargetZone: raw?.plotTargetZone ?? false,
    leftMvcKg: Math.max(0, raw?.leftMvcKg ?? 0),
    rightMvcKg: Math.max(0, raw?.rightMvcKg ?? 0),
    targetZoneMinPercent: normalizePercent(raw?.targetZoneMinPercent ?? 40),
    targetZoneMaxPercent: normalizePercent(raw?.targetZoneMaxPercent ?? 80),
  }
}

function buildTimeline(config: RepeatersConfig): TimelinePhase[] {
  const phases: TimelinePhase[] = []
  let cursor = 0
  for (let setIndex = 0; setIndex < config.sets; setIndex++) {
    for (let repIndex = 0; repIndex < config.repsPerSet; repIndex++) {
      phases.push({
        type: "work",
        setIndex,
        repIndex,
        startSecond: cursor,
        endSecond: cursor + config.workSeconds,
      })
      cursor += config.workSeconds
      const isLastRepOfSet = repIndex === config.repsPerSet - 1
      const isLastSet = setIndex === config.sets - 1
      if (!isLastRepOfSet && config.restSeconds > 0) {
        phases.push({
          type: "rest",
          setIndex,
          repIndex,
          startSecond: cursor,
          endSecond: cursor + config.restSeconds,
        })
        cursor += config.restSeconds
      }
      if (isLastRepOfSet && !isLastSet && config.pauseSeconds > 0) {
        phases.push({
          type: "pause",
          setIndex,
          repIndex,
          startSecond: cursor,
          endSecond: cursor + config.pauseSeconds,
        })
        cursor += config.pauseSeconds
      }
    }
  }
  return phases
}

function findPhase(timeline: TimelinePhase[], elapsedSeconds: number): TimelinePhase | undefined {
  return timeline.find((phase) => elapsedSeconds >= phase.startSecond && elapsedSeconds < phase.endSecond)
}

async function runRepeatersCapture(
  device: CliDevice,
  options: RunOptions,
  config: RepeatersConfig,
  side: "left" | "right" | "single",
): Promise<{ result?: RepeatersResult; cancelled: boolean }> {
  const ctx = options.ctx ?? { json: false, unit: "kg" as const, language: "en" as const }
  const label: RepeatersResult["label"] = side === "left" ? "Left" : side === "right" ? "Right" : "Single"
  const displayLabel = side === "left" ? t("menu.left") : side === "right" ? t("menu.right") : t("menu.single")
  const repeatersName = t("actions.repeaters.name")
  const timeline = buildTimeline(config)
  const totalSeconds = timeline.at(-1)?.endSecond ?? 0
  const zone = resolveTargetZone(config as TargetLevelsConfig, side, ctx.unit)
  const chartEnabled = !ctx.json && process.stdout.isTTY
  const chart = createChartRenderer({ disabled: !chartEnabled, unit: ctx.unit, dimStatus: false })

  let peak = 0
  let workForceSum = 0
  let workSampleCount = 0
  let inZoneSeconds = 0
  let belowZoneSeconds = 0
  let aboveZoneSeconds = 0
  let lastTime: number | undefined
  let lastForce = 0
  let lastWasWork = false
  let startMs = 0

  device.notify((data) => {
    const now = Date.now()
    const force = Number.isFinite(data.current) ? Math.max(0, data.current) : 0
    if (force > peak) peak = force

    const elapsedSeconds = Math.max(0, (now - startMs) / 1000)
    const phase = findPhase(timeline, elapsedSeconds)
    const inWork = phase?.type === "work"
    if (inWork) {
      workForceSum += force
      workSampleCount++
    }

    if (lastTime != null && zone && lastWasWork) {
      const dt = Math.max(0, now - lastTime) / 1000
      if (lastForce < zone.min) belowZoneSeconds += dt
      else if (lastForce > zone.max) aboveZoneSeconds += dt
      else inZoneSeconds += dt
    }
    lastTime = now
    lastForce = force
    lastWasWork = inWork

    if (chartEnabled) chart.push({ current: data.current, mean: data.mean, peak: data.peak })
    if (ctx.json) outputJson({ ...data, test: "repeaters", side: label.toLowerCase() })
  }, ctx.unit)

  if (!ctx.json) {
    console.log(pc.dim(`\n${displayLabel} ${repeatersName.toLowerCase()}`))
    console.log(
      pc.dim(
        `Sets ${config.sets} · Reps ${config.repsPerSet} · Work ${formatClock(config.workSeconds)} · Rest ${formatClock(
          config.restSeconds,
        )} · Pause ${formatClock(config.pauseSeconds)}`,
      ),
    )
    if (zone) {
      console.log(
        pc.dim(
          `Target levels: ${zone.min.toFixed(2)}-${zone.max.toFixed(2)} ${ctx.unit} (${config.targetZoneMinPercent.toFixed(0)}-${config.targetZoneMaxPercent.toFixed(0)}% of ${zone.mvcKg.toFixed(2)}kg MVC)`,
        ),
      )
    }
  }

  if (chartEnabled) {
    chart.start()
    chart.push({ current: 0, mean: 0, peak: 0 })
  }
  if (!ctx.json && config.countdownSeconds > 0) {
    await runCountdown(config.countdownSeconds, chartEnabled ? chart : undefined)
  }

  let statusInterval: ReturnType<typeof setInterval> | undefined
  let cancelled = false
  startMs = Date.now()
  try {
    const streamPromise = device.stream?.(totalSeconds * 1000) ?? Promise.resolve()
    void streamPromise.catch(() => undefined)
    statusInterval = chartEnabled
      ? setInterval(() => {
          const elapsed = Math.max(0, (Date.now() - startMs) / 1000)
          const phase = findPhase(timeline, elapsed)
          const remaining = Math.max(0, totalSeconds - Math.floor(elapsed))
          if (!phase) {
            chart.setStatus(
              `${repeatersName} ${formatClock(totalSeconds)} / ${formatClock(totalSeconds)} · ${t("menu.done")}`,
            )
            return
          }
          const phaseLabel =
            phase.type === "work"
              ? t("menu.work").toUpperCase()
              : phase.type === "rest"
                ? t("menu.rest").toUpperCase()
                : t("menu.pause").toUpperCase()
          const setNum = phase.setIndex + 1
          const repNum = phase.repIndex + 1
          const phaseRemaining = Math.max(0, Math.ceil(phase.endSecond - elapsed))
          chart.setStatus(
            `${t("menu.set")} ${setNum}/${config.sets} ${t("menu.rep")} ${repNum}/${config.repsPerSet} ${phaseLabel} ${formatClock(
              phaseRemaining,
            )} · ${t("menu.total")} ${formatClock(Math.floor(elapsed))}/${formatClock(totalSeconds)} (${t("menu.remaining-short")} ${formatClock(
              remaining,
            )}) · ${t("menu.press-esc-to-stop")}`,
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

  if (cancelled || workSampleCount === 0) return { cancelled }

  return {
    cancelled: false,
    result: {
      side,
      label,
      peak,
      meanWork: workForceSum / workSampleCount,
      inZoneSeconds,
      belowZoneSeconds,
      aboveZoneSeconds,
    },
  }
}

function describeOptions(config: RepeatersConfig, t: (key: string) => string): string[] {
  const lines: string[] = [
    `${t("menu.sets")}: ${config.sets}`,
    `${t("menu.set-reps")}: ${config.repsPerSet}`,
    `${t("menu.work")}: ${formatClock(config.workSeconds)}`,
    `${t("menu.rest")}: ${formatClock(config.restSeconds)}`,
    `${t("menu.pause")}: ${formatClock(config.pauseSeconds)}`,
    `${t("menu.countdown")}: ${formatClock(config.countdownSeconds)}`,
    `${t("menu.left-right-mode")}: ${config.leftRightMode ? t("menu.enabled") : t("menu.disabled")}`,
  ]
  if (config.leftRightMode) {
    lines.push(`${t("menu.start-side-first")}: ${config.startSide === "left" ? t("menu.left") : t("menu.right")}`)
    lines.push(`${t("menu.pause-between-sides")}: ${formatClock(config.pauseBetweenSidesSeconds)}`)
  }
  lines.push(`${t("menu.plot-target-levels")}: ${config.plotTargetZone ? t("menu.enabled") : t("menu.disabled")}`)
  if (config.plotTargetZone) {
    lines.push(`${t("menu.left-mvc")}: ${config.leftMvcKg.toFixed(2)} kg`)
    lines.push(`${t("menu.right-mvc")}: ${config.rightMvcKg.toFixed(2)} kg`)
    lines.push(
      `${t("menu.target-levels")} range: ${config.targetZoneMinPercent.toFixed(0)}% - ${config.targetZoneMaxPercent.toFixed(0)}%`,
    )
  }
  return lines
}

export async function runRepeatersAction(device: CliDevice, options: RunOptions): Promise<void> {
  const ctx = options.ctx ?? { json: false, unit: "kg" as const, language: "en" as const }
  setTranslationLanguage(ctx.language)
  const repeatersLabel = t("actions.repeaters.name")
  if (typeof device.stream !== "function") return

  const config = normalizeRepeatersConfig(options)
  writeSessionConfig(options, "repeaters", config)

  if (!ctx.json && !options.nonInteractive) {
    console.log(pc.cyan("\nRepeaters\n") + pc.dim("─".repeat(60) + "\n"))
    const shouldStart = await promptStreamActionStart(ctx, {
      onConfigureOptions: async () => {
        const openTargetLevelsSubmenu = async (): Promise<void> => {
          await promptStreamActionOptionsMenu(
            `${repeatersLabel} ${t("menu.target-levels")}`,
            [
              {
                label: () =>
                  `${t("menu.plot-target-levels")}: ${config.plotTargetZone ? t("menu.enabled") : t("menu.disabled")}`,
                run: async () => {
                  config.plotTargetZone =
                    (await select({
                      message: `${t("menu.plot-target-levels")}:`,
                      choices: [
                        { name: t("menu.enabled"), value: true },
                        { name: t("menu.disabled"), value: false },
                      ],
                      default: config.plotTargetZone,
                    })) ?? config.plotTargetZone
                  writeSessionConfig(options, "repeaters", config)
                },
              },
              {
                label: () => `${t("menu.left-mvc")}: ${config.leftMvcKg.toFixed(2)} kg`,
                disabled: () => !config.plotTargetZone,
                run: async () => {
                  config.leftMvcKg = await promptNumberOption(`${t("menu.left-mvc")} (kg)`, config.leftMvcKg, 0)
                  writeSessionConfig(options, "repeaters", config)
                },
              },
              {
                label: () => `${t("menu.right-mvc")}: ${config.rightMvcKg.toFixed(2)} kg`,
                disabled: () => !config.plotTargetZone,
                run: async () => {
                  config.rightMvcKg = await promptNumberOption(`${t("menu.right-mvc")} (kg)`, config.rightMvcKg, 0)
                  writeSessionConfig(options, "repeaters", config)
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
                  writeSessionConfig(options, "repeaters", config)
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
                  config.targetZoneMinPercent = await promptPercentOption(
                    t("menu.min-target-percent"),
                    config.targetZoneMinPercent,
                  )
                  if (config.targetZoneMinPercent > config.targetZoneMaxPercent) {
                    config.targetZoneMaxPercent = config.targetZoneMinPercent
                  }
                  writeSessionConfig(options, "repeaters", config)
                },
              },
              {
                label: () => `${t("menu.max-target-percent")}: ${config.targetZoneMaxPercent.toFixed(0)}%`,
                disabled: () => !config.plotTargetZone,
                run: async () => {
                  config.targetZoneMaxPercent = await promptPercentOption(
                    t("menu.max-target-percent"),
                    config.targetZoneMaxPercent,
                  )
                  if (config.targetZoneMaxPercent < config.targetZoneMinPercent) {
                    config.targetZoneMinPercent = config.targetZoneMaxPercent
                  }
                  writeSessionConfig(options, "repeaters", config)
                },
              },
            ],
            ctx.language,
          )
        }

        const openLeftRightSubmenu = async (): Promise<void> => {
          await promptStreamActionOptionsMenu(
            `${repeatersLabel} ${t("menu.left-right")}`,
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
                  writeSessionConfig(options, "repeaters", config)
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
                  writeSessionConfig(options, "repeaters", config)
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
                  writeSessionConfig(options, "repeaters", config)
                },
              },
            ],
            ctx.language,
          )
        }

        await promptStreamActionOptionsMenu(
          repeatersLabel,
          [
            {
              label: () => `${t("menu.sets")}: ${config.sets}`,
              run: async () => {
                config.sets = Math.max(1, Math.trunc(await promptNumberOption(t("menu.sets"), config.sets, 1)))
                writeSessionConfig(options, "repeaters", config)
              },
            },
            {
              label: () => `${t("menu.set-reps")}: ${config.repsPerSet}`,
              run: async () => {
                config.repsPerSet = Math.max(
                  1,
                  Math.trunc(await promptNumberOption(t("menu.set-reps"), config.repsPerSet, 1)),
                )
                writeSessionConfig(options, "repeaters", config)
              },
            },
            {
              label: () => `${t("menu.work")}: ${formatClock(config.workSeconds)}`,
              run: async () => {
                config.workSeconds = await promptClockSecondsOption(t("menu.work"), config.workSeconds, 1)
                writeSessionConfig(options, "repeaters", config)
              },
            },
            {
              label: () => `${t("menu.rest")}: ${formatClock(config.restSeconds)}`,
              run: async () => {
                config.restSeconds = await promptClockSecondsOption(t("menu.rest"), config.restSeconds, 0)
                writeSessionConfig(options, "repeaters", config)
              },
            },
            {
              label: () => `${t("menu.pause")}: ${formatClock(config.pauseSeconds)}`,
              run: async () => {
                config.pauseSeconds = await promptClockSecondsOption(t("menu.pause"), config.pauseSeconds, 0)
                writeSessionConfig(options, "repeaters", config)
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
                writeSessionConfig(options, "repeaters", config)
              },
            },
            {
              label: () => `${t("menu.left-right")}: ${config.leftRightMode ? t("menu.enabled") : t("menu.disabled")}`,
              run: openLeftRightSubmenu,
            },
            {
              label: () =>
                `${t("menu.target-levels")}: ${config.plotTargetZone ? t("menu.enabled") : t("menu.disabled")}`,
              run: openTargetLevelsSubmenu,
            },
          ],
          ctx.language,
        )
      },
      getOptionsLabel: () => `${t("menu.options")} (${describeOptions(config, t).join(", ")})`,
      onViewMeasurements: async () => viewSavedMeasurements("repeaters", repeatersLabel, ctx.language),
    })
    if (!shouldStart) return
  }

  await ensureTaredForStreamAction(device, options)

  const sequence: ("left" | "right" | "single")[] = config.leftRightMode
    ? [config.startSide, config.startSide === "left" ? "right" : "left"]
    : ["single"]

  const results: RepeatersResult[] = []
  let cancelled = false
  for (let i = 0; i < sequence.length; i++) {
    const side = sequence[i]
    const capture = await runRepeatersCapture(device, options, config, side)
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
    if (!ctx.json) console.log(pc.dim(`\n${t("menu.repeaters-stopped")}`))
    return
  }

  const summary = results.map((item) => {
    const tracked = item.inZoneSeconds + item.belowZoneSeconds + item.aboveZoneSeconds
    const inZonePercent = tracked > 0 ? (item.inZoneSeconds / tracked) * 100 : 0
    return {
      side: item.side,
      peak: +item.peak.toFixed(2),
      meanWork: +item.meanWork.toFixed(2),
      inZoneSeconds: +item.inZoneSeconds.toFixed(2),
      inZonePercent: +inZonePercent.toFixed(1),
      belowZoneSeconds: +item.belowZoneSeconds.toFixed(2),
      aboveZoneSeconds: +item.aboveZoneSeconds.toFixed(2),
    }
  })

  if (ctx.json) {
    outputJson({
      summary: {
        test: "repeaters",
        cancelled,
        config: {
          sets: config.sets,
          repsPerSet: config.repsPerSet,
          workSeconds: config.workSeconds,
          restSeconds: config.restSeconds,
          pauseSeconds: config.pauseSeconds,
          countdownSeconds: config.countdownSeconds,
          leftRightMode: config.leftRightMode,
          startSide: config.startSide,
          pauseBetweenSidesSeconds: config.pauseBetweenSidesSeconds,
          plotTargetZone: config.plotTargetZone,
          leftMvcKg: config.leftMvcKg,
          rightMvcKg: config.rightMvcKg,
          targetZoneMinPercent: config.targetZoneMinPercent,
          targetZoneMaxPercent: config.targetZoneMaxPercent,
        },
        results: summary,
        unit: ctx.unit,
      },
    })
    return
  }

  console.log(pc.cyan(`\n${t("menu.repeaters-results")}\n`))
  for (const item of summary) {
    console.log(
      `${pc.bold(item.side.toUpperCase())}: ${t("menu.peak").toLowerCase()} ${item.peak.toFixed(2)} ${ctx.unit}, ${t("menu.mean-work").toLowerCase()} ${item.meanWork.toFixed(2)} ${ctx.unit}`,
    )
    if (config.plotTargetZone) {
      console.log(
        pc.dim(
          `  ${t("menu.in-target")}: ${item.inZoneSeconds.toFixed(2)}s (${item.inZonePercent.toFixed(1)}%) | ${t("menu.below")}: ${item.belowZoneSeconds.toFixed(2)}s | ${t("menu.above")}: ${item.aboveZoneSeconds.toFixed(2)}s`,
        ),
      )
    }
  }

  await promptSaveMeasurement("repeaters", repeatersLabel, options, {
    headline: `Repeaters mean(work) ${summary.map((s) => `${s.side}:${s.meanWork.toFixed(2)}`).join(" | ")} ${ctx.unit}`,
    details: describeOptions(config, t),
    data: {
      cancelled,
      config,
      results: summary,
      unit: ctx.unit,
    },
  })
}

export function buildRepeatersAction(): Action {
  return {
    actionId: "repeaters",
    name: "Repeaters",
    description: "Design a custom workout consisting of sets and repetitions.",
    run: async (device: CliDevice, options: RunOptions) => runRepeatersAction(device, options),
  }
}
