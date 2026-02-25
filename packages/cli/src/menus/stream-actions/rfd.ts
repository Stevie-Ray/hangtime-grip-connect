import input from "@inquirer/input"
import process from "node:process"
import select from "@inquirer/select"
import pc from "picocolors"
import { createChartRenderer, renderRfdAnalyzeChart, type RfdChartPoint } from "../../chart.js"
import { promptAndDownloadSessionData } from "../../services/export.js"
import { formatClock } from "../../time.js"
import type { Action, CliDevice, ForceMeasurement, RunOptions } from "../../types.js"
import { setTranslationLanguage, t } from "../interactive/translations.js"
import { muteNotify, outputJson, waitForKeyToStop } from "../../utils.js"
import {
  ensureTaredForStreamAction,
  promptIntegerSecondsOption,
  runCountdown,
  promptSaveMeasurement,
  promptStreamActionOptionsMenu,
  promptStreamActionStart,
  viewSavedMeasurements,
} from "./shared.js"

const RFD_TIME_WINDOWS = [100, 150, 200, 250, 300, 1000] as const

type RfdModeChoice = "20-80" | 100 | 150 | 200 | 250 | 300 | 1000

interface RfdComputedMetrics {
  maxForce: number
  rfdValue: number
  line20?: number
  line80?: number
}

interface CapturedRfdSample {
  measurement: ForceMeasurement
  receivedAtMs: number
}

function interpolateForce(points: RfdChartPoint[], targetTimeMs: number): number {
  const first = points[0]
  if (!first) return 0
  if (targetTimeMs <= first.timeMs) return first.force
  const last = points[points.length - 1]
  if (!last) return 0
  if (targetTimeMs >= last.timeMs) return last.force

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const next = points[i]
    if (!prev || !next) continue
    if (next.timeMs < targetTimeMs) continue
    const dt = next.timeMs - prev.timeMs
    if (dt <= 0) return next.force
    const ratio = (targetTimeMs - prev.timeMs) / dt
    return prev.force + (next.force - prev.force) * ratio
  }

  return last.force
}

function findFirstCrossing(points: RfdChartPoint[], threshold: number, fromTimeMs = 0): number | undefined {
  const first = points[0]
  if (!first) return undefined
  let prev = first

  for (const current of points) {
    if (current.timeMs < fromTimeMs) {
      prev = current
      continue
    }
    if (current.force >= threshold) {
      const baseTime = Math.max(fromTimeMs, prev.timeMs)
      const baseForce = interpolateForce(points, baseTime)
      if (baseForce >= threshold) return baseTime
      const df = current.force - baseForce
      if (df <= 0) return current.timeMs
      const dt = current.timeMs - baseTime
      if (dt <= 0) return current.timeMs
      const ratio = (threshold - baseForce) / df
      return baseTime + dt * ratio
    }
    prev = current
  }

  return undefined
}

function buildRfdPoints(samples: CapturedRfdSample[], captureStartMs: number, windowMs = 5000): RfdChartPoint[] {
  const captureEndMs = captureStartMs + windowMs
  const points = samples
    .filter(
      (s) =>
        Number.isFinite(s.receivedAtMs) &&
        Number.isFinite(s.measurement.current) &&
        s.receivedAtMs >= captureStartMs &&
        s.receivedAtMs <= captureEndMs,
    )
    .map((s) => ({
      timeMs: Math.max(0, s.receivedAtMs - captureStartMs),
      force: Math.max(0, s.measurement.current),
    }))
    .sort((a, b) => a.timeMs - b.timeMs)

  if (points.length === 0) return points
  const first = points[0]
  if (first && first.timeMs > 0) {
    points.unshift({ timeMs: 0, force: first.force })
  }
  return points
}

function computeRfdMetrics(
  points: RfdChartPoint[],
  mode: RfdModeChoice,
  threshold: number,
  maxForceHint = 0,
): RfdComputedMetrics {
  const maxForce = Math.max(
    maxForceHint,
    points.reduce((m, p) => (p.force > m ? p.force : m), 0),
  )
  const lastTimeMs = points.at(-1)?.timeMs ?? 0
  const onsetTimeMs = findFirstCrossing(points, Math.max(0, threshold), 0) ?? 0
  const onsetForce = interpolateForce(points, onsetTimeMs)

  if (mode === "20-80") {
    const line20 = maxForce * 0.2
    const line80 = maxForce * 0.8
    const t20 = findFirstCrossing(points, line20, onsetTimeMs)
    const t80 = t20 != null ? findFirstCrossing(points, line80, t20) : undefined
    const deltaMs = t20 != null && t80 != null ? t80 - t20 : 0
    const rfdValue = deltaMs > 0 ? (line80 - line20) / (deltaMs / 1000) : 0
    return { maxForce, rfdValue, line20, line80 }
  }

  const target = Math.min(lastTimeMs, onsetTimeMs + mode)
  const deltaMs = target - onsetTimeMs
  const rfdValue = deltaMs > 0 ? (interpolateForce(points, target) - onsetForce) / (deltaMs / 1000) : 0
  return { maxForce, rfdValue }
}

/**
 * Run one RFD capture and optional post-capture analysis.
 * Uses the connected device directly without command-layer adapters.
 */
export async function runRfdAction(device: CliDevice, opts: RunOptions): Promise<void> {
  const ctx = opts.ctx ?? { json: false, unit: "kg", language: "en" }
  setTranslationLanguage(ctx.language)
  const rfdLabel = t("actions.rfd.name")
  let duration = opts.stream?.durationMs ?? 5000
  const unit = ctx.unit
  const rfdSession = opts.session?.rfd
  let rfdThreshold = rfdSession?.threshold ?? 0.5
  let countDownTime = rfdSession?.countDownTime ?? 3
  let distributionMode: "single" | "bilateral" = rfdSession?.mode === "bilateral" ? "bilateral" : "single"
  if (typeof device.stream !== "function") return
  const rawRfdSamples: CapturedRfdSample[] = []
  let captureStartMs = Date.now()
  const chartEnabled = !ctx.json && process.stdout.isTTY
  const chart = createChartRenderer({ disabled: !chartEnabled, unit: ctx.unit, dimStatus: false })
  let cancelled = false
  if (!ctx.json) {
    const durationSeconds = duration / 1000
    console.log(
      pc.cyan("\nRFD\n") +
        pc.dim("─".repeat(60) + "\n") +
        t("copy.rfdIntro", { durationSeconds }) +
        pc.yellow(t("copy.rfdTareReminder")),
    )
    if (!opts.nonInteractive) {
      const shouldStart = await promptStreamActionStart(ctx, {
        onConfigureOptions: async () => {
          const openProtocolSubmenu = async (): Promise<void> => {
            const durationSeconds = Math.max(1, Math.round(duration / 1000))
            await promptStreamActionOptionsMenu(
              `${rfdLabel} ${t("menu.protocol")}`,
              [
                {
                  label: () => `${t("menu.duration")}: ${Math.max(1, Math.round(duration / 1000))}s`,
                  run: async () => {
                    const nextSeconds = await promptIntegerSecondsOption(t("menu.duration"), durationSeconds, 1)
                    duration = nextSeconds * 1000
                    opts.stream = { ...(opts.stream ?? {}), durationMs: duration }
                  },
                },
                {
                  label: () => `${t("menu.countdown")}: ${formatClock(countDownTime)}`,
                  run: async () => {
                    countDownTime = await promptIntegerSecondsOption(t("menu.countdown"), countDownTime, 0)
                    opts.session = {
                      ...(opts.session ?? {}),
                      rfd: {
                        ...(opts.session?.rfd ?? {}),
                        countDownTime,
                        mode: distributionMode,
                        threshold: rfdThreshold,
                      },
                    }
                  },
                },
                {
                  label: () => `${t("menu.threshold")}: ${rfdThreshold.toFixed(2)} ${unit}`,
                  run: async () => {
                    const raw = await input({
                      message: `${t("menu.threshold")} (${unit}):`,
                      default: rfdThreshold.toFixed(2),
                    })
                    const next = Number.parseFloat(raw?.trim() ?? rfdThreshold.toString())
                    if (Number.isFinite(next) && next >= 0) {
                      rfdThreshold = next
                      opts.session = {
                        ...(opts.session ?? {}),
                        rfd: {
                          ...(opts.session?.rfd ?? {}),
                          countDownTime,
                          mode: distributionMode,
                          threshold: rfdThreshold,
                        },
                      }
                    }
                  },
                },
              ],
              ctx.language,
            )
          }

          const openModeSubmenu = async (): Promise<void> => {
            await promptStreamActionOptionsMenu(
              `${rfdLabel} ${t("menu.mode")}`,
              [
                {
                  label: () =>
                    `${t("menu.left-right-mode")}: ${distributionMode === "bilateral" ? t("menu.enabled") : t("menu.disabled")}`,
                  run: async () => {
                    distributionMode =
                      (await select({
                        message: `${t("menu.enable-left-right-mode")}:`,
                        choices: [
                          { name: t("menu.enabled"), value: "bilateral" as const },
                          { name: t("menu.disabled"), value: "single" as const },
                        ],
                        default: distributionMode,
                      })) ?? distributionMode
                    opts.session = {
                      ...(opts.session ?? {}),
                      rfd: {
                        ...(opts.session?.rfd ?? {}),
                        countDownTime,
                        mode: distributionMode,
                        threshold: rfdThreshold,
                      },
                    }
                  },
                },
              ],
              ctx.language,
            )
          }

          await promptStreamActionOptionsMenu(
            rfdLabel,
            [
              {
                label: () => `${t("menu.protocol")}: ${t("menu.countdown")} ${formatClock(countDownTime)}`,
                run: openProtocolSubmenu,
              },
              {
                label: () =>
                  `${t("menu.mode")}: ${t("menu.left-right")} ${distributionMode === "bilateral" ? t("menu.enabled") : t("menu.disabled")}`,
                run: openModeSubmenu,
              },
            ],
            ctx.language,
          )
        },
        getOptionsLabel: () =>
          `${t("menu.options")} (${t("menu.duration")}: ${Math.max(1, Math.round(duration / 1000))}s, ${t("menu.countdown")}: ${formatClock(countDownTime)}, ${t("menu.threshold")}: ${rfdThreshold.toFixed(2)} ${unit}, ${t("menu.left-right")}: ${distributionMode === "bilateral" ? t("menu.on") : t("menu.off")})`,
        onViewMeasurements: async () => viewSavedMeasurements("rfd", rfdLabel, ctx.language),
      })
      if (!shouldStart) return
    }
    await ensureTaredForStreamAction(device, opts)
    console.log(pc.dim(`\n${t("menu.press-esc-to-stop")}`))
    if (chartEnabled) {
      chart.start()
      chart.push({ current: 0, mean: 0, peak: 0 })
    }
    await runCountdown(countDownTime, chartEnabled ? chart : undefined)
  } else {
    await ensureTaredForStreamAction(device, opts)
  }
  device.notify((data: ForceMeasurement) => {
    if (ctx.json) {
      outputJson(data)
    } else {
      rawRfdSamples.push({ measurement: data, receivedAtMs: Date.now() })
      if (chartEnabled) {
        chart.push({ current: data.current, mean: data.mean, peak: data.peak })
      }
    }
  }, ctx.unit)
  let rfdSucceeded: boolean
  try {
    if (!ctx.json) {
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, Math.max(0, ms)))
      const show = (msg: string) => {
        if (chartEnabled) chart.setStatus(msg)
        else console.log(pc.bold(msg))
      }

      // Show 3 immediately after the session countdown; stream starts on "2".
      show(t("menu.pull-in", { seconds: 3 }))
      await sleep(1000)
      show(t("menu.pull-in", { seconds: 2 }))
      captureStartMs = Date.now()
      const streamPromise = device.stream(duration)
      // Prevent late rejections from surfacing if user stops early.
      void streamPromise.catch(() => undefined)
      await sleep(1000)
      show(t("menu.pull-in", { seconds: 1 }))
      await sleep(1000)
      show(t("menu.pull"))
      await sleep(700)
      if (chartEnabled) chart.setStatus("")
      const stopPromise = process.stdin.isTTY ? waitForKeyToStop() : (Promise.race([]) as Promise<void>)
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
      captureStartMs = Date.now()
      await device.stream(duration)
      await device.stop?.()
    }
    rfdSucceeded = true
  } catch (err) {
    if (!ctx.json) {
      console.error(pc.red(`\nRFD capture failed: ${err instanceof Error ? err.message : String(err)}`))
      console.error(pc.dim("The device may have disconnected. Check the connection and try again.\n"))
    }
    rfdSucceeded = rawRfdSamples.length > 0
  } finally {
    if (chartEnabled) chart.stop()
  }
  muteNotify(device)
  if (!ctx.json && cancelled) {
    console.log(pc.dim(`\n${t("menu.rfd-stopped")}`))
    return
  }
  if (!ctx.json && rfdSucceeded) {
    if (chartEnabled) {
      // Extra safety clear for terminals that occasionally leave chart ghost lines.
      process.stdout.write("\r\x1b[24A\x1b[J")
    }
    const rfdPoints = buildRfdPoints(rawRfdSamples, captureStartMs, duration)
    const peakHint = rawRfdSamples.reduce((m, s) => {
      const p = Number.isFinite(s.measurement.peak) ? s.measurement.peak : 0
      const c = Number.isFinite(s.measurement.current) ? s.measurement.current : 0
      return Math.max(m, p, c)
    }, 0)
    let analyzeMode: RfdModeChoice = rfdSession?.rfdMode ?? "20-80"
    let done = false
    let lastAnalyzed:
      | {
          mode: RfdModeChoice
          rfdValue: number
          maxForce: number
        }
      | undefined

    while (!done) {
      const metrics = computeRfdMetrics(rfdPoints, analyzeMode, rfdThreshold, peakHint)
      lastAnalyzed = { mode: analyzeMode, rfdValue: metrics.rfdValue, maxForce: metrics.maxForce }
      const show2080 = analyzeMode === "20-80"
      const analyzeChart = renderRfdAnalyzeChart({
        points: rfdPoints,
        maxForce: metrics.maxForce,
        ...(metrics.line20 != null ? { line20: metrics.line20 } : {}),
        ...(metrics.line80 != null ? { line80: metrics.line80 } : {}),
        show2080,
      })

      console.log(pc.cyan(`\n${t("menu.rfd-analyze")}\n`))
      if (analyzeChart) console.log(analyzeChart)
      console.log(pc.dim("─".repeat(40)))
      if (show2080) {
        console.log(`  ${pc.bold(`${t("menu.rfd-2080")}:`)}  ${metrics.rfdValue.toFixed(2)} ${unit}/s`)
      } else {
        console.log(
          `  ${pc.bold(`${t("menu.rfd-window", { mode: `${analyzeMode}` })}:`)}   ${metrics.rfdValue.toFixed(2)} ${unit}/s`,
        )
      }
      console.log("")

      if (!process.stdin.isTTY || !process.stdout.isTTY) break
      const nav = await select({
        message: `${rfdLabel} ${t("menu.rfd-view").toLowerCase()}:`,
        choices: [
          {
            name: analyzeMode === "20-80" ? `20/80 (${t("menu.active")})` : "20/80",
            value: "20-80" as const,
          },
          {
            name:
              analyzeMode !== "20-80"
                ? `${t("menu.time-interval")} (${t("menu.active")}: ${analyzeMode} ms)`
                : t("menu.time-interval"),
            value: "time" as const,
          },
          { name: `${t("menu.threshold")} (${rfdThreshold.toFixed(2)} ${unit})`, value: "threshold" as const },
          { name: t("menu.continue"), value: "done" as const },
        ],
      })
      if (nav === "done") {
        done = true
        continue
      }
      if (nav === "20-80") {
        analyzeMode = "20-80"
        continue
      }
      if (nav === "threshold") {
        const raw = await input({
          message: `${t("menu.onset-threshold")} (${unit}):`,
          default: rfdThreshold.toFixed(2),
        })
        const v = parseFloat(raw?.trim() ?? rfdThreshold.toString())
        rfdThreshold = Number.isFinite(v) ? v : rfdThreshold
        opts.session = {
          ...(opts.session ?? {}),
          rfd: {
            ...(opts.session?.rfd ?? {}),
            threshold: rfdThreshold,
            countDownTime,
            mode: distributionMode,
            rfdMode: analyzeMode,
          },
        }
        continue
      }
      const pickedWindow = await select({
        message: `${t("menu.time-interval")}:`,
        choices: RFD_TIME_WINDOWS.map((ms) => ({
          name: `${ms} ms`,
          value: ms as RfdModeChoice,
        })),
      })
      analyzeMode = pickedWindow
      opts.session = {
        ...(opts.session ?? {}),
        rfd: {
          ...(opts.session?.rfd ?? {}),
          mode: distributionMode,
          countDownTime,
          threshold: rfdThreshold,
          rfdMode: analyzeMode,
        },
      }
    }

    if (lastAnalyzed) {
      const modeLabel = lastAnalyzed.mode === "20-80" ? "20/80" : `${lastAnalyzed.mode}ms`
      await promptSaveMeasurement("rfd", rfdLabel, opts, {
        headline: `RFD ${modeLabel}: ${lastAnalyzed.rfdValue.toFixed(2)} ${unit}/s`,
        details: [
          `${t("menu.max-force")}: ${lastAnalyzed.maxForce.toFixed(2)} ${unit}`,
          `${t("menu.threshold")}: ${rfdThreshold.toFixed(2)} ${unit}`,
          `${t("menu.left-right-mode")}: ${distributionMode === "bilateral" ? t("menu.enabled") : t("menu.disabled")}`,
        ],
        data: {
          rfdMode: lastAnalyzed.mode,
          mode: distributionMode,
          rfdValue: +lastAnalyzed.rfdValue.toFixed(2),
          maxForce: +lastAnalyzed.maxForce.toFixed(2),
          threshold: +rfdThreshold.toFixed(2),
          countDownTime,
          unit,
        },
      })
    }
  }
  if (rfdSucceeded) {
    await promptAndDownloadSessionData(device, ctx, opts.export?.format)
  }
}

export function buildRfdAction(): Action {
  return {
    actionId: "rfd",
    name: "RFD",
    description: "Record and calculate Rate of Force Development or explosive strength.",
    run: async (device: CliDevice, options: RunOptions) => runRfdAction(device, options),
  }
}
