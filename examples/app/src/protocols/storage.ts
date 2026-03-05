import type { SessionResult, TestId } from "./types.js"

function configKey(testId: TestId): string {
  return `grip-connect.chart.config.${testId}`
}

function resultKey(testId: TestId): string {
  return `grip-connect.chart.result.${testId}`
}

export function loadConfig<T>(testId: TestId, fallback: T): T {
  try {
    const raw = localStorage.getItem(configKey(testId))
    if (!raw) return fallback
    const parsed = JSON.parse(raw) as unknown
    if (typeof parsed !== "object" || parsed === null) return fallback
    return { ...fallback, ...(parsed as Record<string, unknown>) } as T
  } catch {
    return fallback
  }
}

export function saveConfig<T>(testId: TestId, config: T): void {
  localStorage.setItem(configKey(testId), JSON.stringify(config))
}

export function loadLastResult(testId: TestId): SessionResult | null {
  const measurements = listMeasurements(testId)
  if (measurements.length === 0) return null
  const latest = measurements[0]
  if (!latest) return null
  return {
    headline: latest.headline,
    details: latest.details,
  }
}

export interface StoredMeasurement extends SessionResult {
  createdAt: string
  tag?: string
  comment?: string
}

export interface MeasurementMetadata {
  tag?: string
  comment?: string
}

export function listMeasurements(testId: TestId): StoredMeasurement[] {
  try {
    const raw = localStorage.getItem(resultKey(testId))
    if (!raw) return []
    const parsed = JSON.parse(raw) as unknown
    if (!Array.isArray(parsed)) return []
    const items = parsed
      .map((item) => {
        if (typeof item !== "object" || item === null) return null
        const createdAt = (item as { createdAt?: unknown }).createdAt
        const headline = (item as { headline?: unknown }).headline
        const details = (item as { details?: unknown }).details
        const tag = (item as { tag?: unknown }).tag
        const comment = (item as { comment?: unknown }).comment
        if (typeof createdAt !== "string" || typeof headline !== "string" || !Array.isArray(details)) return null
        return {
          createdAt,
          headline,
          details: details.filter((value): value is string => typeof value === "string"),
          ...(typeof tag === "string" && tag.trim().length > 0 ? { tag: tag.trim() } : {}),
          ...(typeof comment === "string" && comment.trim().length > 0 ? { comment: comment.trim() } : {}),
        } satisfies StoredMeasurement
      })
      .filter((item): item is StoredMeasurement => item !== null)
    return items.sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0))
  } catch {
    return []
  }
}

export function saveLastResult(testId: TestId, result: SessionResult): void {
  saveMeasurement(testId, result)
}

export function listMeasurementTags(testId: TestId): string[] {
  const unique = new Set<string>()
  for (const measurement of listMeasurements(testId)) {
    const tag = measurement.tag?.trim()
    if (tag) unique.add(tag)
  }
  return Array.from(unique).sort((a, b) => a.localeCompare(b))
}

export function saveMeasurement(testId: TestId, result: SessionResult, metadata?: MeasurementMetadata): void {
  const existing = listMeasurements(testId)
  const tag = metadata?.tag?.trim()
  const comment = metadata?.comment?.trim()
  const next: StoredMeasurement = {
    createdAt: new Date().toISOString(),
    headline: result.headline,
    details: result.details,
    ...(tag ? { tag } : {}),
    ...(comment ? { comment } : {}),
  }
  const updated = [next, ...existing].slice(0, 200)
  localStorage.setItem(resultKey(testId), JSON.stringify(updated))
}
