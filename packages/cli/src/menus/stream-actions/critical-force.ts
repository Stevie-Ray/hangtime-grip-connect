import process from "node:process"
import pc from "picocolors"
import { createChartRenderer, renderCriticalForceChart, type RfdChartPoint } from "../../chart.js"
import type { Action, CliDevice, ForceMeasurement, RunOptions } from "../../types.js"
import { fail, muteNotify, outputJson, printSuccess, waitForKeyToStop } from "../../utils.js"
import { ensureTaredForStreamAction, promptIntegerSecondsOption, promptStreamActionStart } from "./shared.js"

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
  const ctx = opts.ctx ?? { json: false, unit: "kg" }
  if (typeof device.stream !== "function") {
    fail("Critical Force not supported on this device.")
  }

  const chartEnabled = !ctx.json && process.stdout.isTTY
  const chart = createChartRenderer({ disabled: !chartEnabled, unit: ctx.unit, dimStatus: false })
  let countdownSeconds = opts.session?.criticalForce?.countdownSeconds ?? 3
  const countdown = async (prefix: string, seconds: number): Promise<void> => {
    for (let i = seconds; i >= 1; i--) {
      if (chartEnabled) {
        chart.setStatus(`${prefix} ${i}`)
      } else {
        console.log(pc.bold(`${prefix} ${i}`))
      }
      await new Promise((r) => setTimeout(r, 1000))
    }
    if (chartEnabled) chart.setStatus("")
  }
  const samples: CriticalForceSample[] = []
  const sessionPoints: RfdChartPoint[] = []
  let maxForce = 0
  let lastCurrent = 0
  let sessionStartMs = 0

  if (!ctx.json) {
    console.log(
      pc.cyan("\nCritical Force\n") +
        pc.dim("─".repeat(60) + "\n") +
        "In this test we utilize the methodology outlined in the scientific paper titled " +
        pc.italic("An All-Out Test to Determine Finger Flexor Critical Force in Rock Climbers") +
        " to measure critical force. " +
        "The objective is to determine the force level you can sustain over a long period without fatigue, " +
        "which is done by performing a series of 'pulls' until the force output flattens out and reaches a plateau.\n\n" +
        "To identify it, you'll execute up to " +
        pc.bold("24 'pulls'") +
        ", each lasting for " +
        pc.bold("7 seconds") +
        " where you are pulling as hard as possible. " +
        "This is followed by a " +
        pc.bold("3 second") +
        " break. " +
        "If you reach the plateau before 24 reps, you have the option to cancel and save.\n",
    )

    const shouldStart = await promptStreamActionStart(ctx, {
      onConfigureOptions: async () => {
        countdownSeconds = await promptIntegerSecondsOption("Countdown", countdownSeconds, 0)
        opts.session = {
          ...(opts.session ?? {}),
          criticalForce: { ...(opts.session?.criticalForce ?? {}), countdownSeconds },
        }
      },
      getOptionsLabel: () => `Options (Countdown: ${countdownSeconds}s)`,
    })
    if (!shouldStart) return
    await ensureTaredForStreamAction(device, opts)
    console.log(pc.dim("\nPress Esc to stop"))
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
    await countdown("Session starts in:", countdownSeconds)
  }

  const stopPromise = process.stdin.isTTY ? waitForKeyToStop() : (Promise.race([]) as Promise<void>)
  let endedEarly = false
  let streamError: unknown

  sessionStartMs = Date.now()
  const statusInterval = chartEnabled
    ? setInterval(() => {
        const elapsed = Date.now() - sessionStartMs
        const { completedReps, inPull, secondsRemaining } = getRepAndPhase(elapsed)
        const phaseText = inPull ? `PULL (${secondsRemaining}s)` : `REST (${secondsRemaining}s)`
        chart.setStatus(
          `Reps ${completedReps}/${TOTAL_REPS} Current: ${lastCurrent.toFixed(2)}${ctx.unit} ${phaseText}`,
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

  console.log(pc.cyan("\nCritical Force Result\n"))
  if (finalChart) {
    console.log(finalChart)
  } else {
    console.log(pc.dim("No chart data captured."))
  }

  console.log(pc.dim("─".repeat(50)))
  console.log(`  ${pc.bold("Reps:")} ${Math.min(TOTAL_REPS, perRepMeans.length)}/${TOTAL_REPS}`)
  console.log(`  ${pc.bold("Critical Force:")} ${criticalForce.toFixed(2)} ${ctx.unit}`)
  console.log(`  ${pc.bold("W':")} ${wPrime.toFixed(2)} ${ctx.unit}*s`)
  console.log("")
  console.log(
    `W' represents the amount of work that can be performed above your Critical Force (CF). CF is determined per Gilles et al. (2010) as the mean force from the final six contractions, excluding outliers beyond one standard deviation. To calculate W', we integrate the force-time data relative to CF. Practically, for each of consecutive measurements, we take (Force - CF) and apply the trapezoid rule over the time interval. Summing across all reps yields your total W'.`,
  )

  if (endedEarly) {
    printSuccess("Critical Force session stopped early and results were saved.")
  } else {
    printSuccess("Critical Force session complete.")
  }
}

export function buildCriticalForceAction(): Action {
  return {
    name: "Critical Force",
    description: "Determine your sustainable maximum force with repeated pulls.",
    run: async (device: CliDevice, options: RunOptions) => runCriticalForceAction(device, options),
  }
}
