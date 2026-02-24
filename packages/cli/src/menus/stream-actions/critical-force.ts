import process from "node:process"
import pc from "picocolors"
import { createChartRenderer, renderCriticalForceChart, type RfdChartPoint } from "../../chart.js"
import { formatClock } from "../../time.js"
import type { Action, CliDevice, ForceMeasurement, RunOptions } from "../../types.js"
import { setTranslationLanguage, t } from "../interactive/translations.js"
import { fail, muteNotify, outputJson, printSuccess, waitForKeyToStop } from "../../utils.js"
import {
  ensureTaredForStreamAction,
  promptSaveMeasurement,
  promptIntegerSecondsOption,
  runCountdown,
  promptStreamActionOptionsMenu,
  promptStreamActionStart,
  viewSavedMeasurements,
} from "./shared.js"

const TOTAL_REPS = 24
const PULL_MS = 7000
const REST_MS = 3000
const CYCLE_MS = PULL_MS + REST_MS
const SESSION_MS = TOTAL_REPS * CYCLE_MS

interface CriticalForceSample {
  timeMs: number
  force: number
  repIndex: number
  inPull: boolean
}

function average(values: number[]): number {
  if (values.length === 0) return 0
  return values.reduce((sum, value) => sum + value, 0) / values.length
}

function standardDeviation(values: number[]): number {
  if (values.length === 0) return 0
  const mean = average(values)
  const variance = values.reduce((sum, value) => sum + (value - mean) ** 2, 0) / values.length
  return Math.sqrt(Math.max(0, variance))
}

function computeCriticalForce(perRepMeans: number[]): number {
  const finalSix = perRepMeans.slice(-6)
  if (finalSix.length === 0) return 0
  const mean = average(finalSix)
  const std = standardDeviation(finalSix)
  const filtered = finalSix.filter((value) => Math.abs(value - mean) <= std)
  return average(filtered.length > 0 ? filtered : finalSix)
}

function computeWPrime(samples: CriticalForceSample[], criticalForce: number): number {
  if (samples.length < 2) return 0
  let total = 0
  for (let i = 1; i < samples.length; i++) {
    const prev = samples[i - 1]
    const next = samples[i]
    if (!prev || !next) continue
    const dtSec = Math.max(0, next.timeMs - prev.timeMs) / 1000
    if (dtSec <= 0) continue
    const y0 = Math.max(0, prev.force - criticalForce)
    const y1 = Math.max(0, next.force - criticalForce)
    total += (y0 + y1) * 0.5 * dtSec
  }
  return total
}

function getRepAndPhase(elapsedMs: number): {
  repIndex: number
  completedReps: number
  inPull: boolean
  secondsRemaining: number
} {
  const bounded = Math.max(0, Math.min(elapsedMs, SESSION_MS - 1))
  const repIndex = Math.min(TOTAL_REPS - 1, Math.floor(bounded / CYCLE_MS))
  const phaseMs = bounded % CYCLE_MS
  const inPull = phaseMs < PULL_MS
  const completedReps = Math.min(TOTAL_REPS, Math.floor(Math.max(0, elapsedMs) / CYCLE_MS))
  const phaseDurationMs = inPull ? PULL_MS : REST_MS
  const phaseElapsedMs = inPull ? phaseMs : phaseMs - PULL_MS
  const secondsRemaining = Math.max(1, Math.ceil((phaseDurationMs - phaseElapsedMs) / 1000))
  return { repIndex, completedReps, inPull, secondsRemaining }
}

/**
 * Run a 24x (7s pull / 3s rest) Critical Force protocol with live charting.
 */
export async function runCriticalForceAction(device: CliDevice, opts: RunOptions): Promise<void> {
  const ctx = opts.ctx ?? { json: false, unit: "kg", language: "en" }
  setTranslationLanguage(ctx.language)
  const criticalForceLabel = t("actions.critical-force.name")
  if (typeof device.stream !== "function") {
    fail("Critical Force not supported on this device.")
  }

  const chartEnabled = !ctx.json && process.stdout.isTTY
  const chart = createChartRenderer({ disabled: !chartEnabled, unit: ctx.unit, dimStatus: false })
  let countdownSeconds = opts.session?.criticalForce?.countdownSeconds ?? 3
  const samples: CriticalForceSample[] = []
  const sessionPoints: RfdChartPoint[] = []
  let maxForce = 0
  let lastCurrent = 0
  let sessionStartMs = 0

  if (!ctx.json) {
    console.log(
      pc.cyan(`\n${t("menu.critical-force")}\n`) + pc.dim("─".repeat(60) + "\n") + t("copy.criticalForceIntro"),
    )

    if (!opts.nonInteractive) {
      const shouldStart = await promptStreamActionStart(ctx, {
        onConfigureOptions: async () => {
          const openProtocolSubmenu = async (): Promise<void> => {
            await promptStreamActionOptionsMenu(
              `${criticalForceLabel} ${t("menu.protocol")}`,
              [
                {
                  label: () => `${t("menu.countdown")}: ${formatClock(countdownSeconds)}`,
                  run: async () => {
                    countdownSeconds = await promptIntegerSecondsOption(t("menu.countdown"), countdownSeconds, 0)
                    opts.session = {
                      ...(opts.session ?? {}),
                      criticalForce: { ...(opts.session?.criticalForce ?? {}), countdownSeconds },
                    }
                  },
                },
              ],
              ctx.language,
            )
          }

          await promptStreamActionOptionsMenu(
            criticalForceLabel,
            [
              {
                label: () => `${t("menu.protocol")}: ${t("menu.countdown")} ${formatClock(countdownSeconds)}`,
                run: openProtocolSubmenu,
              },
            ],
            ctx.language,
          )
        },
        getOptionsLabel: () => `${t("menu.options")} (${t("menu.countdown")}: ${formatClock(countdownSeconds)})`,
        onViewMeasurements: async () => viewSavedMeasurements("critical-force", criticalForceLabel, ctx.language),
      })
      if (!shouldStart) return
    }
    await ensureTaredForStreamAction(device, opts)
    console.log(pc.dim(`\n${t("menu.press-esc-to-stop")}`))
  } else {
    await ensureTaredForStreamAction(device, opts)
  }

  device.notify((data: ForceMeasurement) => {
    const now = Date.now()
    const elapsed = sessionStartMs > 0 ? now - sessionStartMs : 0
    const { repIndex, inPull } = getRepAndPhase(elapsed)
    const force = Math.max(0, Number.isFinite(data.current) ? data.current : 0)
    lastCurrent = force
    if (force > maxForce) maxForce = force

    samples.push({ timeMs: elapsed, force, repIndex, inPull })
    sessionPoints.push({ timeMs: elapsed, force })

    if (ctx.json) {
      outputJson({ ...data, rep: repIndex + 1, inPull })
      return
    }

    if (chartEnabled) {
      chart.push({ current: data.current, mean: data.mean, peak: data.peak })
    }
  }, ctx.unit)

  if (chartEnabled) {
    chart.start()
    chart.push({ current: 0, mean: 0, peak: 0 })
  }

  if (!ctx.json) {
    await runCountdown(countdownSeconds, chartEnabled ? chart : undefined)
  }

  const stopPromise = process.stdin.isTTY ? waitForKeyToStop() : (Promise.race([]) as Promise<void>)
  let endedEarly = false
  let streamError: unknown

  sessionStartMs = Date.now()
  const statusInterval = chartEnabled
    ? setInterval(() => {
        const elapsed = Date.now() - sessionStartMs
        const { completedReps, inPull, secondsRemaining } = getRepAndPhase(elapsed)
        const phase = inPull ? t("menu.pull") : t("menu.rest")
        chart.setStatus(
          t("menu.reps-current-phase", {
            completed: completedReps,
            total: TOTAL_REPS,
            current: lastCurrent.toFixed(2),
            unit: ctx.unit,
            phase,
            seconds: secondsRemaining,
          }),
        )
      }, 100)
    : undefined

  const streamPromise = device.stream(SESSION_MS)
  // Prevent late rejections from surfacing if user stops early.
  void streamPromise.catch(() => undefined)

  try {
    const state = await Promise.race([
      streamPromise.then(() => "done" as const),
      stopPromise.then(() => "stop" as const),
    ])
    if (state === "stop") {
      endedEarly = true
      await device.stop?.()
    } else {
      await streamPromise.catch((error: unknown) => {
        streamError = error
      })
    }
  } finally {
    if (statusInterval) clearInterval(statusInterval)
    if (chartEnabled) chart.stop()
  }

  muteNotify(device)

  if (streamError && samples.length === 0) {
    throw streamError
  }

  const perRepMeans: number[] = []
  for (let repIndex = 0; repIndex < TOTAL_REPS; repIndex++) {
    const repSamples = samples.filter((sample) => sample.repIndex === repIndex && sample.inPull).map((s) => s.force)
    if (repSamples.length > 0) perRepMeans.push(average(repSamples))
  }

  const criticalForce = computeCriticalForce(perRepMeans)
  const wPrime = computeWPrime(samples, criticalForce)

  if (ctx.json) {
    outputJson({
      summary: {
        totalReps: TOTAL_REPS,
        completedReps: Math.min(TOTAL_REPS, perRepMeans.length),
        criticalForce: +criticalForce.toFixed(2),
        wPrime: +wPrime.toFixed(2),
        unit: ctx.unit,
        endedEarly,
      },
    })
    return
  }

  const finalChart = renderCriticalForceChart({
    points: sessionPoints,
    criticalForce,
    maxForce,
  })

  console.log(pc.cyan(`\n${t("menu.critical-force-result")}\n`))
  if (finalChart) {
    console.log(finalChart)
  } else {
    console.log(pc.dim(t("menu.no-chart-data-captured")))
  }

  console.log(pc.dim("─".repeat(50)))
  console.log(`  ${pc.bold(`${t("menu.reps")}:`)} ${Math.min(TOTAL_REPS, perRepMeans.length)}/${TOTAL_REPS}`)
  console.log(`  ${pc.bold(`${t("menu.critical-force")}:`)} ${criticalForce.toFixed(2)} ${ctx.unit}`)
  console.log(`  ${pc.bold("W':")} ${wPrime.toFixed(2)} ${ctx.unit}*s`)
  console.log("")
  console.log(t("menu.w-prime-explainer"))

  await promptSaveMeasurement("critical-force", criticalForceLabel, opts, {
    headline: `CF ${criticalForce.toFixed(2)} ${ctx.unit} | W' ${wPrime.toFixed(2)} ${ctx.unit}*s`,
    details: [
      `${t("menu.reps")}: ${Math.min(TOTAL_REPS, perRepMeans.length)}/${TOTAL_REPS}`,
      `${t("menu.ended-early")}: ${endedEarly ? t("menu.yes") : t("menu.no")}`,
    ],
    data: {
      totalReps: TOTAL_REPS,
      completedReps: Math.min(TOTAL_REPS, perRepMeans.length),
      criticalForce: +criticalForce.toFixed(2),
      wPrime: +wPrime.toFixed(2),
      unit: ctx.unit,
      endedEarly,
    },
  })

  if (endedEarly) {
    printSuccess(t("menu.critical-force-session-stopped-early-saved"))
  } else {
    printSuccess(t("menu.critical-force-session-complete"))
  }
}

export function buildCriticalForceAction(): Action {
  return {
    actionId: "critical-force",
    name: "Critical Force",
    description: "Determine your sustainable maximum force with repeated pulls.",
    run: async (device: CliDevice, options: RunOptions) => runCriticalForceAction(device, options),
  }
}
