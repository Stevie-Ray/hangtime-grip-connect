import { mkdir, readFile, writeFile } from "node:fs/promises"
import os from "node:os"
import path from "node:path"
import type { ForceUnit } from "../types.js"

export type MeasurementTestKey = "peak-force-mvc" | "rfd" | "critical-force" | "endurance" | "repeaters"

export interface MeasurementRecord {
  id: string
  createdAt: string
  testKey: MeasurementTestKey
  testName: string
  headline: string
  details: string[]
  unit?: ForceUnit
  data: Record<string, unknown>
}

interface MeasurementStoreFile {
  records: MeasurementRecord[]
}

function getMeasurementsDir(): string {
  return path.join(os.homedir(), ".grip-connect")
}

function getMeasurementsFilePath(): string {
  return path.join(getMeasurementsDir(), "measurements.json")
}

async function readStore(): Promise<MeasurementStoreFile> {
  const filePath = getMeasurementsFilePath()
  try {
    const raw = await readFile(filePath, "utf8")
    const parsed = JSON.parse(raw) as Partial<MeasurementStoreFile>
    const records = Array.isArray(parsed.records) ? parsed.records : []
    return { records }
  } catch {
    return { records: [] }
  }
}

async function writeStore(store: MeasurementStoreFile): Promise<void> {
  const dirPath = getMeasurementsDir()
  const filePath = getMeasurementsFilePath()
  await mkdir(dirPath, { recursive: true })
  await writeFile(filePath, JSON.stringify(store, null, 2) + "\n", "utf8")
}

function makeId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export async function saveMeasurementRecord(
  input: Omit<MeasurementRecord, "id" | "createdAt">,
): Promise<MeasurementRecord> {
  const store = await readStore()
  const record: MeasurementRecord = {
    id: makeId(),
    createdAt: new Date().toISOString(),
    testKey: input.testKey,
    testName: input.testName,
    headline: input.headline,
    details: input.details,
    ...(input.unit ? { unit: input.unit } : {}),
    data: input.data,
  }
  store.records.push(record)
  await writeStore(store)
  return record
}

export async function listMeasurementRecords(testKey: MeasurementTestKey): Promise<MeasurementRecord[]> {
  const store = await readStore()
  return store.records
    .filter((record) => record.testKey === testKey)
    .sort((a, b) => (a.createdAt > b.createdAt ? -1 : a.createdAt < b.createdAt ? 1 : 0))
}
