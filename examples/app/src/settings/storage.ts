import type { ForceUnit, FrezDynoCoefficientLookupParams } from "@hangtime/grip-connect"
import { parseBaudRate, parseSamplingRate, type DeviceBaudRate, type DeviceSamplingRate } from "./rates.js"

export type CliLanguage = "en" | "es" | "de" | "it" | "no" | "fr" | "nl"

export interface ChartPreferences {
  unit: ForceUnit
  language: CliLanguage
  baudRate: DeviceBaudRate | null
  frezDynoCoefficient: number | null
  frezDynoCoefficientCache: Record<string, number>
  frezDynoSerialNumbers: Record<string, string>
  sampleRate: DeviceSamplingRate | null
}

const SETTINGS_KEY = "grip-connect.chart.settings"

const DEFAULT_SETTINGS: ChartPreferences = {
  unit: "kg",
  language: "en",
  baudRate: null,
  frezDynoCoefficient: null,
  frezDynoCoefficientCache: {},
  frezDynoSerialNumbers: {},
  sampleRate: null,
}

export function parseFrezDynoSerialNumber(value: unknown): string | null {
  if (typeof value !== "string") return null
  const serialNumber = value.trim()
  if (!serialNumber || serialNumber.length > 128 || !/^[a-zA-Z0-9._:-]+$/.test(serialNumber)) return null
  return serialNumber
}

function parseFrezDynoDeviceId(value: unknown): string | null {
  if (typeof value !== "string") return null
  const deviceId = value.trim()
  if (!deviceId || deviceId.length > 512 || ["__proto__", "constructor", "prototype"].includes(deviceId)) return null
  return deviceId
}

function parseFrezDynoSerialNumbers(value: unknown): Record<string, string> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  const serialNumbers: Record<string, string> = {}
  for (const [rawDeviceId, rawSerialNumber] of Object.entries(value)) {
    const deviceId = parseFrezDynoDeviceId(rawDeviceId)
    const serialNumber = parseFrezDynoSerialNumber(rawSerialNumber)
    if (deviceId && serialNumber) serialNumbers[deviceId] = serialNumber
  }
  return serialNumbers
}

export function loadFrezDynoSerialNumber(deviceId: unknown): string | null {
  const parsedDeviceId = parseFrezDynoDeviceId(deviceId)
  if (!parsedDeviceId) return null
  return loadPreferences().frezDynoSerialNumbers[parsedDeviceId] ?? null
}

export function saveFrezDynoSerialNumber(deviceId: unknown, serialNumber: unknown): boolean {
  const parsedDeviceId = parseFrezDynoDeviceId(deviceId)
  const parsedSerialNumber = parseFrezDynoSerialNumber(serialNumber)
  if (!parsedDeviceId || (serialNumber != null && serialNumber !== "" && !parsedSerialNumber)) return false

  const currentSerialNumbers = loadPreferences().frezDynoSerialNumbers
  const serialNumbers = parsedSerialNumber
    ? { ...currentSerialNumbers, [parsedDeviceId]: parsedSerialNumber }
    : Object.fromEntries(Object.entries(currentSerialNumbers).filter(([deviceId]) => deviceId !== parsedDeviceId))
  savePreferences({ frezDynoSerialNumbers: serialNumbers })
  return true
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

export function parseFrezDynoCoefficient(value: unknown): number | null {
  const coefficient = Number(value)
  return Number.isFinite(coefficient) && coefficient !== 0 ? coefficient : null
}

function parseFrezDynoCoefficientCache(value: unknown): Record<string, number> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  const cache: Record<string, number> = {}
  for (const [key, entryValue] of Object.entries(value)) {
    const coefficient = parseFrezDynoCoefficient(entryValue)
    if (coefficient) cache[key] = coefficient
  }

  return cache
}

function frezDynoCoefficientCacheKey(params: FrezDynoCoefficientLookupParams): string | null {
  const serial = params.deviceSerialNumber?.trim().toLowerCase()
  if (serial) return `serial:${serial}`

  const name = params.deviceName?.trim().toLowerCase()
  if (name) return `name:${name}`

  return null
}

export function loadFrezDynoCoefficientCache(params: FrezDynoCoefficientLookupParams): number | null {
  const cacheKey = frezDynoCoefficientCacheKey(params)
  if (!cacheKey) return null

  return loadPreferences().frezDynoCoefficientCache[cacheKey] ?? null
}

export function saveFrezDynoCoefficientCache(params: FrezDynoCoefficientLookupParams, coefficient: number): void {
  const cacheKey = frezDynoCoefficientCacheKey(params)
  const parsedCoefficient = parseFrezDynoCoefficient(coefficient)
  if (!cacheKey || !parsedCoefficient) return

  const current = loadPreferences()
  savePreferences({
    frezDynoCoefficientCache: {
      ...current.frezDynoCoefficientCache,
      [cacheKey]: parsedCoefficient,
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
      frezDynoCoefficient?: unknown
      frezDynoCoefficientCache?: unknown
      frezDynoSerialNumbers?: unknown
      sampleRate?: unknown
    }
    const unit = parseUnit(parsed.unit) ?? DEFAULT_SETTINGS.unit
    const language = parseLanguage(parsed.language) ?? DEFAULT_SETTINGS.language
    const baudRate = parseBaudRate(parsed.baudRate)
    const frezDynoCoefficient = parseFrezDynoCoefficient(parsed.frezDynoCoefficient)
    const frezDynoCoefficientCache = parseFrezDynoCoefficientCache(parsed.frezDynoCoefficientCache)
    const frezDynoSerialNumbers = parseFrezDynoSerialNumbers(parsed.frezDynoSerialNumbers)
    const sampleRate = parseSamplingRate(parsed.sampleRate)
    return {
      unit,
      language,
      baudRate,
      frezDynoCoefficient,
      frezDynoCoefficientCache,
      frezDynoSerialNumbers,
      sampleRate,
    }
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
    frezDynoCoefficient:
      patch.frezDynoCoefficient === undefined
        ? current.frezDynoCoefficient
        : parseFrezDynoCoefficient(patch.frezDynoCoefficient),
    frezDynoCoefficientCache:
      patch.frezDynoCoefficientCache === undefined
        ? current.frezDynoCoefficientCache
        : parseFrezDynoCoefficientCache(patch.frezDynoCoefficientCache),
    frezDynoSerialNumbers:
      patch.frezDynoSerialNumbers === undefined
        ? current.frezDynoSerialNumbers
        : parseFrezDynoSerialNumbers(patch.frezDynoSerialNumbers),
    sampleRate: patch.sampleRate === undefined ? current.sampleRate : parseSamplingRate(patch.sampleRate),
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}
