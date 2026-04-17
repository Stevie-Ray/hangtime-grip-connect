import type { ForceUnit } from "@hangtime/grip-connect"
import { parseBaudRate, parseSamplingRate, type DeviceBaudRate, type DeviceSamplingRate } from "./rates.js"

export type CliLanguage = "en" | "es" | "de" | "it" | "no" | "fr" | "nl"

export interface ChartPreferences {
  unit: ForceUnit
  language: CliLanguage
  baudRate: DeviceBaudRate | null
  sampleRate: DeviceSamplingRate | null
}

const SETTINGS_KEY = "grip-connect.chart.settings"

const DEFAULT_SETTINGS: ChartPreferences = {
  unit: "kg",
  language: "en",
  baudRate: null,
  sampleRate: null,
}

export function parseUnit(value: unknown): ForceUnit | null {
  if (value === "kg" || value === "lbs" || value === "n") return value
  return null
}

export function parseLanguage(value: unknown): CliLanguage | null {
  if (
    value === "en" ||
    value === "es" ||
    value === "de" ||
    value === "it" ||
    value === "no" ||
    value === "fr" ||
    value === "nl"
  ) {
    return value
  }
  return null
}

export function loadPreferences(): ChartPreferences {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as { unit?: unknown; language?: unknown; baudRate?: unknown; sampleRate?: unknown }
    const unit = parseUnit(parsed.unit) ?? DEFAULT_SETTINGS.unit
    const language = parseLanguage(parsed.language) ?? DEFAULT_SETTINGS.language
    const baudRate = parseBaudRate(parsed.baudRate)
    const sampleRate = parseSamplingRate(parsed.sampleRate)
    return { unit, language, baudRate, sampleRate }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function savePreferences(patch: Partial<ChartPreferences>): ChartPreferences {
  const current = loadPreferences()
  const next: ChartPreferences = {
    unit: parseUnit(patch.unit) ?? current.unit,
    language: parseLanguage(patch.language) ?? current.language,
    baudRate: patch.baudRate === undefined ? current.baudRate : parseBaudRate(patch.baudRate),
    sampleRate: patch.sampleRate === undefined ? current.sampleRate : parseSamplingRate(patch.sampleRate),
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}
