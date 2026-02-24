import process from "node:process"
import select from "@inquirer/select"
import pc from "picocolors"
import { createPeakMvcChartRenderer, renderPeakForceChart, type RfdChartPoint } from "../../chart.js"
import { convertForce, toNewtons } from "../../force-units.js"
import type { Action, CliDevice, CliLanguage, ForceMeasurement, RunOptions } from "../../types.js"
import { setTranslationLanguage, t } from "../interactive/translations.js"
import { muteNotify, outputJson, waitForKeyToStop } from "../../utils.js"
import {
  ensureTaredForStreamAction,
  promptNumberOption,
  promptSaveMeasurement,
  readSessionConfig,
  promptStreamActionOptionsMenu,
  promptStreamActionStart,
  viewSavedMeasurements,
  writeSessionConfig,
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

function resolveBodyWeightUnit(unit: "kg" | "lbs" | "n"): "kg" | "lbs" {
  return unit === "lbs" ? "lbs" : "kg"
}

function normalizePeakConfig(options: RunOptions): PeakForceConfig {
  const raw = readSessionConfig(options, "peakForce")
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

function formatOptionsLabel(config: PeakForceConfig, language: CliLanguage): string {
  setTranslationLanguage(language)
  return (
    `${t("menu.options")} (` +
    `${t("menu.mode")}: ${config.mode === "single" ? t("menu.single") : t("menu.left-right")}, ` +
    `${t("menu.torque")}: ${config.includeTorque ? t("menu.on") : t("menu.off")}, ` +
    `${t("menu.body-weight")}: ${config.includeBodyWeightComparison ? t("menu.on") : t("menu.off")})`
  )
}

async function promptBoolean(message: string, defaultValue: boolean): Promise<boolean> {
  return select({
    message,
    choices: [
      { name: t("menu.enabled"), value: true },
      { name: t("menu.disabled"), value: false },
    ],
    default: defaultValue,
  })
}

async function capturePeakForceTrial(
  device: CliDevice,
  options: RunOptions,
  label: string,
): Promise<PeakForceTrialResult> {
  const ctx = options.ctx ?? { json: false, unit: "kg", language: "en" }
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
      await waitForKeyToStop(t("menu.press-esc-to-stop-capture", { label: label.toLowerCase() }))
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
  console.log(pc.cyan(`\n${trial.label} ${t("menu.result")}\n`))
  if (chart) {
    console.log(chart)
  } else {
    console.log(pc.dim(t("menu.no-chart-data-captured")))
  }

  console.log(pc.dim("─".repeat(50)))
  console.log(`  ${pc.bold(`${t("menu.peak-force")}:`)} ${trial.peakForce.toFixed(2)} ${unit}`)

  if (config.includeTorque) {
    const momentArmMeters = config.momentArmCm / 100
    const torqueNm = toNewtons(trial.peakForce, unit) * momentArmMeters
    console.log(`  ${pc.bold(`${t("menu.torque")}:`)} ${torqueNm.toFixed(2)} N*m`)
  }

  if (config.includeBodyWeightComparison && config.bodyWeight > 0) {
    const peakInBodyWeightUnit = convertForce(trial.peakForce, unit, bodyWeightUnit)
    const ratio = peakInBodyWeightUnit / config.bodyWeight
    console.log(
      `  ${pc.bold(`${t("menu.peak-body-weight")}:`)} ${ratio.toFixed(2)}x (${(ratio * 100).toFixed(1)}%) [${config.bodyWeight.toFixed(2)} ${bodyWeightUnit}]`,
    )
  }
}

export async function runPeakForceMvcAction(device: CliDevice, options: RunOptions): Promise<void> {
  const ctx = options.ctx ?? { json: false, unit: "kg", language: "en" }
  if (typeof device.stream !== "function") return

  setTranslationLanguage(ctx.language)
  const config = normalizePeakConfig(options)
  const bodyWeightUnit = resolveBodyWeightUnit(ctx.unit)
  const peakLabel = t("actions.peak-force-mvc.name")

  if (!ctx.json) {
    console.log(
      pc.cyan(`\n${peakLabel}\n`) +
        pc.dim("─".repeat(60) + "\n") +
        t("copy.peakForceIntro") +
        pc.bold(`${t("menu.what-is-torque")} `) +
        t("copy.peakForceTorqueInfo"),
    )

    if (!options.nonInteractive) {
      const shouldStart = await promptStreamActionStart(ctx, {
        onConfigureOptions: async () => {
          const openTorqueSubmenu = async (): Promise<void> => {
            await promptStreamActionOptionsMenu(
              t("menu.torque"),
              [
                {
                  label: () =>
                    `${t("menu.include-torque-calculation")}: ${config.includeTorque ? t("menu.enabled") : t("menu.disabled")}`,
                  run: async () => {
                    const wasEnabled = config.includeTorque
                    config.includeTorque = await promptBoolean(
                      `${t("menu.include-torque-calculation")}:`,
                      config.includeTorque,
                    )
                    if (!wasEnabled && config.includeTorque) {
                      config.momentArmCm = await promptNumberOption(
                        t("menu.moment-arm-length-cm"),
                        config.momentArmCm,
                        0,
                      )
                    }
                    writeSessionConfig(options, "peakForce", config)
                  },
                },
                {
                  label: () => t("menu.moment-arm-length-cm"),
                  disabled: () => !config.includeTorque,
                  run: async () => {
                    config.momentArmCm = await promptNumberOption(t("menu.moment-arm-length-cm"), config.momentArmCm, 0)
                    writeSessionConfig(options, "peakForce", config)
                  },
                },
              ],
              ctx.language,
            )
          }

          const openBodyWeightSubmenu = async (): Promise<void> => {
            await promptStreamActionOptionsMenu(
              t("menu.body-weight-comparison"),
              [
                {
                  label: () =>
                    `${t("menu.include-body-weight-comparison")}: ${
                      config.includeBodyWeightComparison ? t("menu.enabled") : t("menu.disabled")
                    }`,
                  run: async () => {
                    const wasEnabled = config.includeBodyWeightComparison
                    config.includeBodyWeightComparison = await promptBoolean(
                      `${t("menu.include-body-weight-comparison")}:`,
                      config.includeBodyWeightComparison,
                    )
                    if (!wasEnabled && config.includeBodyWeightComparison) {
                      config.bodyWeight = await promptNumberOption(
                        `${t("menu.body-weight")} (${bodyWeightUnit})`,
                        config.bodyWeight,
                        0.01,
                      )
                    }
                    writeSessionConfig(options, "peakForce", config)
                  },
                },
                {
                  label: () => `${t("menu.body-weight")} (${bodyWeightUnit})`,
                  disabled: () => !config.includeBodyWeightComparison,
                  run: async () => {
                    config.bodyWeight = await promptNumberOption(
                      `${t("menu.body-weight")} (${bodyWeightUnit})`,
                      config.bodyWeight,
                      0.01,
                    )
                    writeSessionConfig(options, "peakForce", config)
                  },
                },
              ],
              ctx.language,
            )
          }

          await promptStreamActionOptionsMenu(
            peakLabel,
            [
              {
                label: () =>
                  `${t("menu.mode")}: ${config.mode === "single" ? t("menu.single-mode") : t("menu.left-right")}`,
                run: async () => {
                  config.mode = await select({
                    message: `${peakLabel} ${t("menu.mode").toLowerCase()}:`,
                    choices: [
                      { name: t("menu.single-mode"), value: "single" as const },
                      { name: t("menu.left-right"), value: "left-right" as const },
                    ],
                    default: config.mode,
                  })
                  writeSessionConfig(options, "peakForce", config)
                },
              },
              {
                label: () =>
                  `${t("menu.torque")}: ${config.includeTorque ? config.momentArmCm.toFixed(0) : t("menu.disabled")}`,
                run: openTorqueSubmenu,
              },
              {
                label: () =>
                  `${t("menu.body-weight-comparison")}: ${
                    config.includeBodyWeightComparison
                      ? `${config.bodyWeight.toFixed(0)}${bodyWeightUnit}`
                      : t("menu.disabled")
                  }`,
                run: openBodyWeightSubmenu,
              },
            ],
            ctx.language,
          )
        },
        getOptionsLabel: () => formatOptionsLabel(config, ctx.language),
        onViewMeasurements: async () => viewSavedMeasurements("peak-force-mvc", peakLabel, ctx.language),
      })
      if (!shouldStart) return
    }
  }

  writeSessionConfig(options, "peakForce", config)
  await ensureTaredForStreamAction(device, options)

  const trialLabels = config.mode === "left-right" ? [t("menu.left"), t("menu.right")] : [t("menu.single")]
  const trialResults: PeakForceTrialResult[] = []

  for (const label of trialLabels) {
    if (!ctx.json) {
      console.log(pc.dim(`\n${label} ${t("menu.trial")}`))
      console.log(pc.dim(t("menu.pull-max-then-esc-finish-trial")))
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

      console.log(pc.cyan(`\n${t("menu.left-right-comparison")}\n`))
      console.log(pc.dim("─".repeat(50)))
      console.log(`  ${pc.bold(`${t("menu.stronger-side")}:`)} ${stronger.label}`)
      console.log(
        `  ${pc.bold(`${t("menu.difference")}:`)} ${(stronger.peakForce - weaker.peakForce).toFixed(2)} ${ctx.unit}`,
      )
      console.log(`  ${pc.bold(`${t("menu.imbalance")}:`)} ${imbalancePct.toFixed(1)}%`)
    }
  }

  const measurementDetails: string[] = trialResults.map(
    (trial) => `${trial.label}: ${trial.peakForce.toFixed(2)} ${ctx.unit}`,
  )
  if (config.includeTorque) {
    measurementDetails.push(`${t("menu.moment-arm-length-cm")}: ${config.momentArmCm.toFixed(2)} cm`)
  }
  if (config.includeBodyWeightComparison) {
    measurementDetails.push(`${t("menu.body-weight")}: ${config.bodyWeight.toFixed(2)} ${bodyWeightUnit}`)
  }
  if (imbalancePct != null) {
    measurementDetails.push(`${t("menu.imbalance")}: ${imbalancePct.toFixed(1)}%`)
  }

  const headline =
    config.mode === "single"
      ? `${t("menu.peak")} ${trialResults[0]?.peakForce.toFixed(2) ?? "0.00"} ${ctx.unit}`
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
    actionId: "peak-force-mvc",
    name: "Peak Force / MVC",
    description: "Record maximum voluntary contraction (MVC), asymmetrically.",
    run: async (device: CliDevice, options: RunOptions) => runPeakForceMvcAction(device, options),
  }
}
