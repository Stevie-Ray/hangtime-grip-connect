import type { ExportFormat } from "./types.js"

const EXPORT_FORMATS: readonly ExportFormat[] = ["csv", "json", "xml"] as const

export function parseDurationSeconds(input: string | undefined): number | undefined {
  if (input == null) return undefined
  const seconds = Number.parseFloat(input)
  if (!Number.isFinite(seconds) || seconds < 0) {
    throw new Error(`Invalid duration: ${input}. Use a non-negative number of seconds.`)
  }
  return Math.round(seconds * 1000)
}

export function parseDurationMilliseconds(input: string): number {
  const duration = Number.parseInt(input, 10)
  if (!Number.isFinite(duration) || duration < 0) {
    throw new Error(`Invalid duration: ${input}. Use a non-negative number of milliseconds.`)
  }
  return duration
}

export function parseThreshold(input: string): number {
  const threshold = Number.parseFloat(input)
  if (!Number.isFinite(threshold) || threshold < 0) {
    throw new Error(`Invalid threshold: ${input}. Use a non-negative number.`)
  }
  return threshold
}

export function parseExportFormat(input: string): ExportFormat {
  const format = input.toLowerCase() as ExportFormat
  if (!EXPORT_FORMATS.includes(format)) {
    throw new Error("Format must be csv, json, or xml.")
  }
  return format
}
