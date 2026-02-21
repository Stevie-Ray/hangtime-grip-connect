import input from "@inquirer/input"
import process from "node:process"
import select from "@inquirer/select"
import pc from "picocolors"
import { createPeakMvcChartRenderer, renderPeakForceChart, type RfdChartPoint } from "../../chart.js"
import type { Action, CliDevice, ForceMeasurement, RunOptions } from "../../types.js"
import { muteNotify, outputJson, waitForKeyToStop } from "../../utils.js"
import {
  ensureTaredForStreamAction,
  promptSaveMeasurement,
  promptStreamActionOptionsMenu,
  promptStreamActionStart,
  viewSavedMeasurements,
} from "./shared.js"

type PeakMode = "single" | "left-right"

interface PeakForceConfig {
  mode: PeakMode
  includeTorque: boolean
  momentArmCm: number
  includeBodyWeightComparison: boolean
  bodyWeight: number
}

interface PeakForceTrialResult {
  label: string
  points: RfdChartPoint[]
  peakForce: number
}

const DEFAULT_CAPTURE_DURATION_MS = 5000
const KG_TO_NEWTON = 9.80665
const LBS_TO_NEWTON = 4.4482216152605

function toNewtons(force: number, unit: "kg" | "lbs" | "n"): number {
  if (unit === "n") return force
  if (unit === "lbs") return force * LBS_TO_NEWTON
  return force * KG_TO_NEWTON
}

function convertForce(value: number, from: "kg" | "lbs" | "n", to: "kg" | "lbs"): number {
  if (to === "kg") {
    if (from === "kg") return value
    if (from === "lbs") return value * 0.45359237
    return value / KG_TO_NEWTON
  }
  if (from === "lbs") return value
  if (from === "kg") return value * 2.2046226218
  return value / LBS_TO_NEWTON
}

function resolveBodyWeightUnit(unit: "kg" | "lbs" | "n"): "kg" | "lbs" {
  return unit === "lbs" ? "lbs" : "kg"
}

function normalizePeakConfig(options: RunOptions): PeakForceConfig {
  const raw = options.session?.peakForce
  const mode = raw?.mode === "left-right" ? "left-right" : "single"
  const includeTorque = raw?.includeTorque ?? false
  const momentArmCm = Math.max(0, raw?.momentArmCm ?? 35)
  const includeBodyWeightComparison = raw?.includeBodyWeightComparison ?? false
  const bodyWeight = Math.max(0, raw?.bodyWeight ?? 70)
  return {
    mode,
    includeTorque,
    momentArmCm,
    includeBodyWeightComparison,
    bodyWeight,
  }
}

function savePeakConfig(options: RunOptions, config: PeakForceConfig): void {
  options.session = {
    ...(options.session ?? {}),
    peakForce: {
      ...(options.session?.peakForce ?? {}),
      mode: config.mode,
      includeTorque: config.includeTorque,
      momentArmCm: config.momentArmCm,
      includeBodyWeightComparison: config.includeBodyWeightComparison,
      bodyWeight: config.bodyWeight,
    },
  }
}

function formatOptionsLabel(config: PeakForceConfig): string {
  return (
    `Options (Mode: ${config.mode === "single" ? "Single" : "Left/Right"}, ` +
    `Torque: ${config.includeTorque ? "On" : "Off"}, ` +
    `Body Weight: ${config.includeBodyWeightComparison ? "On" : "Off"})`
  )
}

async function promptBoolean(message: string, defaultValue: boolean): Promise<boolean> {
  return select({
    message,
    choices: [
      { name: "Enabled", value: true },
      { name: "Disabled", value: false },
    ],
    default: defaultValue,
  })
}

async function promptPositiveNumber(message: string, current: number, minimum = 0): Promise<number> {
  const raw = await input({ message, default: current.toString() })
  const parsed = Number(raw.trim())
  if (!Number.isFinite(parsed)) return current
  return Math.max(minimum, parsed)
}

async function capturePeakForceTrial(
  device: CliDevice,
  options: RunOptions,
  label: string,
): Promise<PeakForceTrialResult> {
  const ctx = options.ctx ?? { json: false, unit: "kg" }
  const points: RfdChartPoint[] = []
  let peakForce = 0
  let startMs = 0
  const chartEnabled = !ctx.json && process.stdout.isTTY
  const chart = createPeakMvcChartRenderer({ disabled: !chartEnabled, unit: ctx.unit, showCurrent: false })

  device.notify((data: ForceMeasurement) => {
    const now = Date.now()
    const elapsed = startMs > 0 ? now - startMs : 0
    const force = Math.max(0, Number.isFinite(data.current) ? data.current : 0)
    points.push({ timeMs: elapsed, force })
    if (force > peakForce) peakForce = force
    if (chartEnabled) chart.push({ current: force, peak: peakForce })

    if (ctx.json) {
      outputJson({ ...data, trial: label })
    }
  }, ctx.unit)

  startMs = Date.now()
  if (typeof device.stream !== "function") {
    muteNotify(device)
    return { label, points, peakForce }
  }

  if (chartEnabled) {
    chart.start()
    chart.push({ current: 0, peak: 0 })
  }

  try {
    if (process.stdin.isTTY && !ctx.json) {
      await device.stream()
      await waitForKeyToStop(`Press Esc to stop ${label.toLowerCase()} capture.`)
      await device.stop?.()
    } else {
      // Fallback for non-interactive runs where Esc is unavailable.
      const durationMs = options.stream?.durationMs ?? DEFAULT_CAPTURE_DURATION_MS
      await device.stream(durationMs)
      await device.stop?.()
    }
  } finally {
    if (chartEnabled) chart.stop()
  }

  muteNotify(device)
  return { label, points, peakForce }
}

function printTrialResult(
  trial: PeakForceTrialResult,
  config: PeakForceConfig,
  unit: "kg" | "lbs" | "n",
  bodyWeightUnit: "kg" | "lbs",
): void {
  const chart = renderPeakForceChart({ points: trial.points, peakForce: trial.peakForce })
  console.log(pc.cyan(`\n${trial.label} Result\n`))
  if (chart) {
    console.log(chart)
  } else {
    console.log(pc.dim("No chart data captured."))
  }

  console.log(pc.dim("─".repeat(50)))
  console.log(`  ${pc.bold("Peak Force:")} ${trial.peakForce.toFixed(2)} ${unit}`)

  if (config.includeTorque) {
    const momentArmMeters = config.momentArmCm / 100
    const torqueNm = toNewtons(trial.peakForce, unit) * momentArmMeters
    console.log(`  ${pc.bold("Torque:")} ${torqueNm.toFixed(2)} N*m`)
  }

  if (config.includeBodyWeightComparison && config.bodyWeight > 0) {
    const peakInBodyWeightUnit = convertForce(trial.peakForce, unit, bodyWeightUnit)
    const ratio = peakInBodyWeightUnit / config.bodyWeight
    console.log(
      `  ${pc.bold("Peak / Body Weight:")} ${ratio.toFixed(2)}x (${(ratio * 100).toFixed(1)}%) [${config.bodyWeight.toFixed(2)} ${bodyWeightUnit}]`,
    )
  }
}

export async function runPeakForceMvcAction(device: CliDevice, options: RunOptions): Promise<void> {
  const ctx = options.ctx ?? { json: false, unit: "kg" }
  if (typeof device.stream !== "function") return

  const config = normalizePeakConfig(options)
  const bodyWeightUnit = resolveBodyWeightUnit(ctx.unit)

  if (!ctx.json) {
    console.log(
      pc.cyan("\nPeak Force / MVC\n") +
        pc.dim("─".repeat(60) + "\n") +
        "Use this test to measure the peak force (maximum voluntary contraction, MVC) of a muscle. " +
        "Choose Single or Left/Right to record one side or both. " +
        "You can also enable torque and body weight calculations to get more detailed insights into your strength measurements.\n\n" +
        pc.bold("What is torque? ") +
        "Torque accounts for your limb length, making it easier to compare strength across different body sizes. " +
        "By measuring the distance from your joint to where force is applied, we can calculate how much rotational strength you produce.\n",
    )

    if (!options.nonInteractive) {
      const shouldStart = await promptStreamActionStart(ctx, {
        onConfigureOptions: async () => {
          const openTorqueSubmenu = async (): Promise<void> => {
            await promptStreamActionOptionsMenu("Torque", [
              {
                label: () => `Include torque calculation: ${config.includeTorque ? "Enabled" : "Disabled"}`,
                run: async () => {
                  const wasEnabled = config.includeTorque
                  config.includeTorque = await promptBoolean("Include torque calculation:", config.includeTorque)
                  if (!wasEnabled && config.includeTorque) {
                    config.momentArmCm = await promptPositiveNumber("Moment arm length (cm):", config.momentArmCm, 0)
                  }
                  savePeakConfig(options, config)
                },
              },
              {
                label: () => "Moment arm length (cm)",
                disabled: () => !config.includeTorque,
                run: async () => {
                  config.momentArmCm = await promptPositiveNumber("Moment arm length (cm):", config.momentArmCm, 0)
                  savePeakConfig(options, config)
                },
              },
            ])
          }

          const openBodyWeightSubmenu = async (): Promise<void> => {
            await promptStreamActionOptionsMenu("Body Weight Comparison", [
              {
                label: () =>
                  `Include body weight comparison: ${config.includeBodyWeightComparison ? "Enabled" : "Disabled"}`,
                run: async () => {
                  const wasEnabled = config.includeBodyWeightComparison
                  config.includeBodyWeightComparison = await promptBoolean(
                    "Include body weight comparison:",
                    config.includeBodyWeightComparison,
                  )
                  if (!wasEnabled && config.includeBodyWeightComparison) {
                    config.bodyWeight = await promptPositiveNumber(
                      `Body weight (${bodyWeightUnit}):`,
                      config.bodyWeight,
                      0.01,
                    )
                  }
                  savePeakConfig(options, config)
                },
              },
              {
                label: () => `Body weight (${bodyWeightUnit})`,
                disabled: () => !config.includeBodyWeightComparison,
                run: async () => {
                  config.bodyWeight = await promptPositiveNumber(
                    `Body weight (${bodyWeightUnit}):`,
                    config.bodyWeight,
                    0.01,
                  )
                  savePeakConfig(options, config)
                },
              },
            ])
          }

          await promptStreamActionOptionsMenu("Peak Force / MVC", [
            {
              label: () => `Mode: ${config.mode === "single" ? "Single mode" : "Left/Right"}`,
              run: async () => {
                config.mode = await select({
                  message: "Peak Force mode:",
                  choices: [
                    { name: "Single mode", value: "single" as const },
                    { name: "Left/Right", value: "left-right" as const },
                  ],
                  default: config.mode,
                })
                savePeakConfig(options, config)
              },
            },
            {
              label: () => `Torque: ${config.includeTorque ? config.momentArmCm.toFixed(0) : "Disabled"}`,
              run: openTorqueSubmenu,
            },
            {
              label: () =>
                `Body weight comparison: ${
                  config.includeBodyWeightComparison ? `${config.bodyWeight.toFixed(0)}${bodyWeightUnit}` : "Disabled"
                }`,
              run: openBodyWeightSubmenu,
            },
          ])
        },
        getOptionsLabel: () => formatOptionsLabel(config),
        onViewMeasurements: async () => viewSavedMeasurements("peak-force-mvc", "Peak Force / MVC"),
      })
      if (!shouldStart) return
    }
  }

  savePeakConfig(options, config)
  await ensureTaredForStreamAction(device, options)

  const trialLabels = config.mode === "left-right" ? ["Left", "Right"] : ["Single"]
  const trialResults: PeakForceTrialResult[] = []

  for (const label of trialLabels) {
    if (!ctx.json) {
      console.log(pc.dim(`\n${label} trial`))
      console.log(pc.dim("Pull maximally, then press Esc to finish the trial."))
    }

    const trial = await capturePeakForceTrial(device, options, label)
    trialResults.push(trial)
  }

  if (ctx.json) {
    const summary = trialResults.map((trial) => {
      const result: Record<string, unknown> = {
        side: trial.label,
        peakForce: +trial.peakForce.toFixed(2),
        unit: ctx.unit,
      }
      if (config.includeTorque) {
        result["torqueNm"] = +(toNewtons(trial.peakForce, ctx.unit) * (config.momentArmCm / 100)).toFixed(2)
      }
      if (config.includeBodyWeightComparison && config.bodyWeight > 0) {
        const peakInBodyWeightUnit = convertForce(trial.peakForce, ctx.unit, bodyWeightUnit)
        result["bodyWeight"] = { value: +config.bodyWeight.toFixed(2), unit: bodyWeightUnit }
        result["peakToBodyWeightRatio"] = +(peakInBodyWeightUnit / config.bodyWeight).toFixed(2)
      }
      return result
    })

    outputJson({
      summary: {
        mode: config.mode,
        trials: summary,
      },
    })
    return
  }

  for (const trial of trialResults) {
    printTrialResult(trial, config, ctx.unit, bodyWeightUnit)
  }

  let imbalancePct: number | undefined
  if (config.mode === "left-right" && trialResults.length === 2) {
    const left = trialResults[0]
    const right = trialResults[1]
    if (left && right) {
      const stronger = left.peakForce >= right.peakForce ? left : right
      const weaker = left.peakForce >= right.peakForce ? right : left
      imbalancePct = stronger.peakForce > 0 ? ((stronger.peakForce - weaker.peakForce) / stronger.peakForce) * 100 : 0

      console.log(pc.cyan("\nLeft/Right Comparison\n"))
      console.log(pc.dim("─".repeat(50)))
      console.log(`  ${pc.bold("Stronger side:")} ${stronger.label}`)
      console.log(`  ${pc.bold("Difference:")} ${(stronger.peakForce - weaker.peakForce).toFixed(2)} ${ctx.unit}`)
      console.log(`  ${pc.bold("Imbalance:")} ${imbalancePct.toFixed(1)}%`)
    }
  }

  const measurementDetails: string[] = trialResults.map(
    (trial) => `${trial.label}: ${trial.peakForce.toFixed(2)} ${ctx.unit}`,
  )
  if (config.includeTorque) {
    measurementDetails.push(`Moment arm: ${config.momentArmCm.toFixed(2)} cm`)
  }
  if (config.includeBodyWeightComparison) {
    measurementDetails.push(`Body weight: ${config.bodyWeight.toFixed(2)} ${bodyWeightUnit}`)
  }
  if (imbalancePct != null) {
    measurementDetails.push(`Imbalance: ${imbalancePct.toFixed(1)}%`)
  }

  const headline =
    config.mode === "single"
      ? `Peak ${trialResults[0]?.peakForce.toFixed(2) ?? "0.00"} ${ctx.unit}`
      : `L ${trialResults[0]?.peakForce.toFixed(2) ?? "0.00"} / R ${trialResults[1]?.peakForce.toFixed(2) ?? "0.00"} ${ctx.unit}`

  await promptSaveMeasurement("peak-force-mvc", "Peak Force / MVC", options, {
    headline,
    details: measurementDetails,
    data: {
      mode: config.mode,
      unit: ctx.unit,
      trials: trialResults.map((trial) => ({
        side: trial.label,
        peakForce: +trial.peakForce.toFixed(2),
      })),
      includeTorque: config.includeTorque,
      momentArmCm: config.includeTorque ? +config.momentArmCm.toFixed(2) : undefined,
      includeBodyWeightComparison: config.includeBodyWeightComparison,
      bodyWeight: config.includeBodyWeightComparison ? +config.bodyWeight.toFixed(2) : undefined,
      bodyWeightUnit: config.includeBodyWeightComparison ? bodyWeightUnit : undefined,
      imbalancePct: imbalancePct != null ? +imbalancePct.toFixed(1) : undefined,
    },
  })
}

export function buildPeakForceMvcAction(): Action {
  return {
    name: "Peak Force / MVC",
    description: "Record maximum voluntary contraction (MVC), asymmetrically.",
    run: async (device: CliDevice, options: RunOptions) => runPeakForceMvcAction(device, options),
  }
}
