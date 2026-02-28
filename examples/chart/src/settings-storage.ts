import type { ForceUnit } from "@hangtime/grip-connect"

export type CliLanguage = "en" | "es" | "de" | "it" | "no" | "fr" | "nl"

export interface ChartPreferences {
  unit: ForceUnit
  language: CliLanguage
}

const SETTINGS_KEY = "grip-connect.chart.settings"

const DEFAULT_SETTINGS: ChartPreferences = {
  unit: "kg",
  language: "en",
}

function parseUnit(value: unknown): ForceUnit | null {
  if (value === "kg" || value === "lbs" || value === "n") return value
  return null
}

function parseLanguage(value: unknown): CliLanguage | null {
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
    const parsed = JSON.parse(raw) as { unit?: unknown; language?: unknown }
    const unit = parseUnit(parsed.unit) ?? DEFAULT_SETTINGS.unit
    const language = parseLanguage(parsed.language) ?? DEFAULT_SETTINGS.language
    return { unit, language }
  } catch {
    return DEFAULT_SETTINGS
  }
}

export function savePreferences(patch: Partial<ChartPreferences>): ChartPreferences {
  const current = loadPreferences()
  const next: ChartPreferences = {
    unit: parseUnit(patch.unit) ?? current.unit,
    language: parseLanguage(patch.language) ?? current.language,
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}
