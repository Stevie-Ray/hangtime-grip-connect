import { mkdir, readFile, writeFile } from "node:fs/promises"
import { readFileSync } from "node:fs"
import os from "node:os"
import path from "node:path"
import type { CliLanguage, ForceUnit } from "../types.js"

export interface CliPreferences {
  unit: ForceUnit
  language: CliLanguage
}

interface PreferenceStoreFile {
  unit?: unknown
  language?: unknown
}

const DEFAULT_PREFERENCES: CliPreferences = {
  unit: "kg",
  language: "en",
}

function getPreferencesDir(): string {
  return path.join(os.homedir(), ".grip-connect")
}

function getPreferencesFilePath(): string {
  return path.join(getPreferencesDir(), "preferences.json")
}

function parseForceUnit(value: unknown): ForceUnit | undefined {
  if (value === "kg" || value === "lbs" || value === "n") return value
  return undefined
}

function parseCliLanguage(value: unknown): CliLanguage | undefined {
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
  return undefined
}

function normalizePreferences(raw: PreferenceStoreFile | undefined): Partial<CliPreferences> {
  const unit = parseForceUnit(raw?.unit)
  const language = parseCliLanguage(raw?.language)
  return {
    ...(unit ? { unit } : {}),
    ...(language ? { language } : {}),
  }
}

async function readStore(): Promise<Partial<CliPreferences>> {
  const filePath = getPreferencesFilePath()
  try {
    const raw = await readFile(filePath, "utf8")
    return normalizePreferences(JSON.parse(raw) as PreferenceStoreFile)
  } catch {
    return {}
  }
}

export function readSavedPreferencesSync(): Partial<CliPreferences> {
  const filePath = getPreferencesFilePath()
  try {
    const raw = readFileSync(filePath, "utf8")
    return normalizePreferences(JSON.parse(raw) as PreferenceStoreFile)
  } catch {
    return {}
  }
}

export async function savePreferences(patch: Partial<CliPreferences>): Promise<CliPreferences> {
  const existing = await readStore()
  const next: CliPreferences = {
    ...DEFAULT_PREFERENCES,
    ...existing,
    ...normalizePreferences(patch),
  }
  const dirPath = getPreferencesDir()
  const filePath = getPreferencesFilePath()
  await mkdir(dirPath, { recursive: true })
  await writeFile(filePath, JSON.stringify(next, null, 2) + "\n", "utf8")
  return next
}
