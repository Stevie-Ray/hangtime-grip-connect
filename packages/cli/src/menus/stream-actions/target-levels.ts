import process from "node:process"
import pc from "picocolors"
import { fromKg, toKg } from "../../force-units.js"
import { setTranslationLanguage, t } from "../interactive/translations.js"
import type { CliDevice, ForceUnit, RunOptions } from "../../types.js"
import { muteNotify, waitForKeyToStop } from "../../utils.js"
import { formatClock } from "../../time.js"
import { runCountdown } from "./shared.js"

export interface TargetLevelsConfig {
  plotTargetZone: boolean
  leftMvcKg: number
  rightMvcKg: number
  targetZoneMinPercent: number
  targetZoneMaxPercent: number
  initialSide: "side.left" | "side.right"
  pauseBetweenSidesSeconds: number
  countdownSeconds: number
}

export interface TargetZone {
  mvcKg: number
  min: number
  max: number
}

function normalizePercent(value: number): number {
  return Math.max(0, Math.min(100, value))
}

export function resolveTargetZone(
  config: TargetLevelsConfig,
  side: "left" | "right" | "single",
  unit: ForceUnit,
): TargetZone | undefined {
  if (!config.plotTargetZone) return undefined
  let mvcKg = 0
  if (side === "left") mvcKg = config.leftMvcKg
  if (side === "right") mvcKg = config.rightMvcKg
  if (side === "single") {
    if (config.leftMvcKg > 0 && config.rightMvcKg > 0) mvcKg = (config.leftMvcKg + config.rightMvcKg) / 2
    else mvcKg = Math.max(config.leftMvcKg, config.rightMvcKg)
  }
  if (mvcKg <= 0) return undefined

  const minKg = mvcKg * (normalizePercent(config.targetZoneMinPercent) / 100)
  const maxKg = mvcKg * (normalizePercent(config.targetZoneMaxPercent) / 100)
  return {
    mvcKg,
    min: fromKg(Math.min(minKg, maxKg), unit),
    max: fromKg(Math.max(minKg, maxKg), unit),
  }
}

export async function captureMvcPeakForSide(
  device: CliDevice,
  options: RunOptions,
  side: "left" | "right",
  sideLabel: "Left" | "Right",
): Promise<number> {
  const ctx = options.ctx ?? { json: false, unit: "kg" as const, language: "en" as const }
  setTranslationLanguage(ctx.language)
  let peak = 0

  device.notify((data) => {
    const current = Number.isFinite(data.current) ? Math.max(0, data.current) : 0
    if (current > peak) peak = current
  }, ctx.unit)

  try {
    const sideWord = side === "left" ? t("menu.left") : t("menu.right")
    console.log(pc.dim(`\n${sideLabel} ${t("menu.mvc-capture").toLowerCase()}`))
    console.log(pc.dim(t("menu.pull-max-side-then-esc-finish", { side: sideWord.toLowerCase() })))
    if (process.stdin.isTTY && !ctx.json) {
      await device.stream?.()
      await waitForKeyToStop(t("menu.press-esc-to-stop-capture", { label: `${side} mvc` }))
      await device.stop?.()
    } else {
      await device.stream?.(5000)
      await device.stop?.()
    }
  } finally {
    muteNotify(device)
  }

  return toKg(peak, ctx.unit)
}

export async function measureMvcSides(
  device: CliDevice,
  options: RunOptions,
  config: TargetLevelsConfig,
): Promise<{ leftMvcKg: number; rightMvcKg: number }> {
  let leftMvcKg = config.leftMvcKg
  let rightMvcKg = config.rightMvcKg
  const firstSide = config.initialSide === "side.left" ? "left" : "right"
  const secondSide = firstSide === "left" ? "right" : "left"
  const order = [firstSide, secondSide] as const
  const sideLabel = (side: "left" | "right"): "Left" | "Right" => (side === "left" ? "Left" : "Right")

  for (let i = 0; i < order.length; i++) {
    const side = order[i]
    if (config.countdownSeconds > 0) await runCountdown(config.countdownSeconds)
    const peakKg = await captureMvcPeakForSide(device, options, side, sideLabel(side))
    if (side === "left") leftMvcKg = peakKg
    if (side === "right") rightMvcKg = peakKg

    if (i < order.length - 1 && config.pauseBetweenSidesSeconds > 0) {
      console.log(pc.dim(`\n${t("menu.pause-between-sides")}: ${formatClock(config.pauseBetweenSidesSeconds)}`))
      await new Promise((resolve) => setTimeout(resolve, config.pauseBetweenSidesSeconds * 1000))
    }
  }

  return { leftMvcKg, rightMvcKg }
}
