import type { ForceUnit, FrezDynoCalibrationLookupParams, FrezDynoCalibrationPoint } from "@hangtime/grip-connect"
import { parseBaudRate, parseSamplingRate, type DeviceBaudRate, type DeviceSamplingRate } from "./rates.js"

export type CliLanguage = "en" | "es" | "de" | "it" | "no" | "fr" | "nl"

export interface ChartPreferences {
  unit: ForceUnit
  language: CliLanguage
  baudRate: DeviceBaudRate | null
  frezDynoCalibrationCache: Record<string, FrezDynoCalibrationPoint[]>
  frezDynoCalibrationPoints: FrezDynoCalibrationPoint[] | null
  sampleRate: DeviceSamplingRate | null
}

const SETTINGS_KEY = "grip-connect.chart.settings"

const DEFAULT_SETTINGS: ChartPreferences = {
  unit: "kg",
  language: "en",
  baudRate: null,
  frezDynoCalibrationCache: {},
  frezDynoCalibrationPoints: null,
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

export function parseFrezDynoCalibrationPoints(value: unknown): FrezDynoCalibrationPoint[] | null {
  if (!Array.isArray(value) || value.length < 2) return null

  const points: FrezDynoCalibrationPoint[] = []
  for (const point of value) {
    if (!point || typeof point !== "object") return null
    const raw = Number((point as { raw?: unknown }).raw)
    const weight = Number((point as { weight?: unknown }).weight)
    if (!Number.isFinite(raw) || !Number.isFinite(weight)) return null
    points.push({ raw, weight })
  }

  const rawValues = new Set(points.map(({ raw }) => raw))
  if (rawValues.size !== points.length) return null

  return points
}

function parseFrezDynoCalibrationCache(value: unknown): Record<string, FrezDynoCalibrationPoint[]> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  const cache: Record<string, FrezDynoCalibrationPoint[]> = {}
  for (const [key, points] of Object.entries(value)) {
    const parsedPoints = parseFrezDynoCalibrationPoints(points)
    if (parsedPoints) cache[key] = parsedPoints
  }

  return cache
}

function frezDynoCalibrationCacheKey(params: FrezDynoCalibrationLookupParams): string | null {
  const serial = params.deviceSerialNumber?.trim().toLowerCase()
  if (serial) return `serial:${serial}`

  const id = params.deviceId?.trim().toLowerCase()
  if (id) return `id:${id}`

  const name = params.deviceName?.trim().toLowerCase()
  if (name) return `name:${name}`

  return null
}

export function loadFrezDynoCalibrationCache(
  params: FrezDynoCalibrationLookupParams,
): FrezDynoCalibrationPoint[] | null {
  const cacheKey = frezDynoCalibrationCacheKey(params)
  if (!cacheKey) return null

  return loadPreferences().frezDynoCalibrationCache[cacheKey] ?? null
}

export function saveFrezDynoCalibrationCache(
  params: FrezDynoCalibrationLookupParams,
  points: FrezDynoCalibrationPoint[],
): void {
  const cacheKey = frezDynoCalibrationCacheKey(params)
  const parsedPoints = parseFrezDynoCalibrationPoints(points)
  if (!cacheKey || !parsedPoints) return

  const current = loadPreferences()
  savePreferences({
    frezDynoCalibrationCache: {
      ...current.frezDynoCalibrationCache,
      [cacheKey]: parsedPoints,
    },
  })
}

export function loadPreferences(): ChartPreferences {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return DEFAULT_SETTINGS
    const parsed = JSON.parse(raw) as {
      unit?: unknown
      language?: unknown
      baudRate?: unknown
      frezDynoCalibrationCache?: unknown
      frezDynoCalibrationPoints?: unknown
      sampleRate?: unknown
    }
    const unit = parseUnit(parsed.unit) ?? DEFAULT_SETTINGS.unit
    const language = parseLanguage(parsed.language) ?? DEFAULT_SETTINGS.language
    const baudRate = parseBaudRate(parsed.baudRate)
    const frezDynoCalibrationCache = parseFrezDynoCalibrationCache(parsed.frezDynoCalibrationCache)
    const frezDynoCalibrationPoints = parseFrezDynoCalibrationPoints(parsed.frezDynoCalibrationPoints)
    const sampleRate = parseSamplingRate(parsed.sampleRate)
    return { unit, language, baudRate, frezDynoCalibrationCache, frezDynoCalibrationPoints, sampleRate }
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
    frezDynoCalibrationCache:
      patch.frezDynoCalibrationCache === undefined
        ? current.frezDynoCalibrationCache
        : parseFrezDynoCalibrationCache(patch.frezDynoCalibrationCache),
    frezDynoCalibrationPoints:
      patch.frezDynoCalibrationPoints === undefined
        ? current.frezDynoCalibrationPoints
        : parseFrezDynoCalibrationPoints(patch.frezDynoCalibrationPoints),
    sampleRate: patch.sampleRate === undefined ? current.sampleRate : parseSamplingRate(patch.sampleRate),
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}
