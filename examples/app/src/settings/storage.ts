import type {
  ForceUnit,
  FrezDynoCalibrationData,
  FrezDynoCalibrationLookupParams,
  FrezDynoCalibrationPoint,
} from "@hangtime/grip-connect"
import { parseBaudRate, parseSamplingRate, type DeviceBaudRate, type DeviceSamplingRate } from "./rates.js"

export type CliLanguage = "en" | "es" | "de" | "it" | "no" | "fr" | "nl"

export interface ChartPreferences {
  unit: ForceUnit
  language: CliLanguage
  baudRate: DeviceBaudRate | null
  frezDynoCalibrationCache: Record<string, FrezDynoCalibrationData>
  frezDynoCalibrationPoints: FrezDynoCalibrationPoint[] | null
  frezDynoSerialNumbers: Record<string, string>
  sampleRate: DeviceSamplingRate | null
}

const SETTINGS_KEY = "grip-connect.chart.settings"

const DEFAULT_SETTINGS: ChartPreferences = {
  unit: "kg",
  language: "en",
  baudRate: null,
  frezDynoCalibrationCache: {},
  frezDynoCalibrationPoints: null,
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

function parseFrezDynoCalibrationData(value: unknown): FrezDynoCalibrationData | null {
  const record = value && typeof value === "object" && !Array.isArray(value) ? value : null
  const points = parseFrezDynoCalibrationPoints(record ? (record as { points?: unknown }).points : value)
  if (!points) return null

  const calibration: FrezDynoCalibrationData = { points }
  if (record) {
    const actualSampleRate = Number((record as { actualSampleRate?: unknown }).actualSampleRate)
    const zeroOffset = Number((record as { zeroOffset?: unknown }).zeroOffset)
    if (Number.isFinite(actualSampleRate) && actualSampleRate > 0) calibration.actualSampleRate = actualSampleRate
    if (Number.isFinite(zeroOffset)) calibration.zeroOffset = zeroOffset
  }
  return calibration
}

function parseFrezDynoCalibrationCache(value: unknown): Record<string, FrezDynoCalibrationData> {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {}

  const cache: Record<string, FrezDynoCalibrationData> = {}
  for (const [key, entryValue] of Object.entries(value)) {
    const calibration = parseFrezDynoCalibrationData(entryValue)
    if (calibration) cache[key] = calibration
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

export function loadFrezDynoCalibrationCache(params: FrezDynoCalibrationLookupParams): FrezDynoCalibrationData | null {
  const cacheKey = frezDynoCalibrationCacheKey(params)
  if (!cacheKey) return null

  return loadPreferences().frezDynoCalibrationCache[cacheKey] ?? null
}

export function saveFrezDynoCalibrationCache(
  params: FrezDynoCalibrationLookupParams,
  calibration: FrezDynoCalibrationData,
): void {
  const cacheKey = frezDynoCalibrationCacheKey(params)
  const parsedCalibration = parseFrezDynoCalibrationData(calibration)
  if (!cacheKey || !parsedCalibration) return

  const current = loadPreferences()
  savePreferences({
    frezDynoCalibrationCache: {
      ...current.frezDynoCalibrationCache,
      [cacheKey]: parsedCalibration,
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
      frezDynoSerialNumbers?: unknown
      sampleRate?: unknown
    }
    const unit = parseUnit(parsed.unit) ?? DEFAULT_SETTINGS.unit
    const language = parseLanguage(parsed.language) ?? DEFAULT_SETTINGS.language
    const baudRate = parseBaudRate(parsed.baudRate)
    const frezDynoCalibrationCache = parseFrezDynoCalibrationCache(parsed.frezDynoCalibrationCache)
    const frezDynoCalibrationPoints = parseFrezDynoCalibrationPoints(parsed.frezDynoCalibrationPoints)
    const frezDynoSerialNumbers = parseFrezDynoSerialNumbers(parsed.frezDynoSerialNumbers)
    const sampleRate = parseSamplingRate(parsed.sampleRate)
    return {
      unit,
      language,
      baudRate,
      frezDynoCalibrationCache,
      frezDynoCalibrationPoints,
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
    frezDynoCalibrationCache:
      patch.frezDynoCalibrationCache === undefined
        ? current.frezDynoCalibrationCache
        : parseFrezDynoCalibrationCache(patch.frezDynoCalibrationCache),
    frezDynoCalibrationPoints:
      patch.frezDynoCalibrationPoints === undefined
        ? current.frezDynoCalibrationPoints
        : parseFrezDynoCalibrationPoints(patch.frezDynoCalibrationPoints),
    frezDynoSerialNumbers:
      patch.frezDynoSerialNumbers === undefined
        ? current.frezDynoSerialNumbers
        : parseFrezDynoSerialNumbers(patch.frezDynoSerialNumbers),
    sampleRate: patch.sampleRate === undefined ? current.sampleRate : parseSamplingRate(patch.sampleRate),
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(next))
  return next
}
