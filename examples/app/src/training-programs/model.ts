export interface TrainingProgramRecord {
  objectID?: string
  id?: string
  title?: string
  name?: string
  date?: number
  description?: string
  likes?: number
  tags?: unknown[]
  [key: string]: unknown
}

export interface TrainingProgramEntry {
  id: string
  program: TrainingProgramRecord
}

export function isTrainingProgramRecord(value: unknown): value is TrainingProgramRecord {
  return typeof value === "object" && value != null
}

export function pickTrainingProgramId(program: TrainingProgramRecord, index: number): string {
  return String(program.objectID ?? program.id ?? `${index}`)
}

export function createTrainingProgramEntries(programs: TrainingProgramRecord[]): TrainingProgramEntry[] {
  return programs.map((program, index) => ({
    program,
    id: pickTrainingProgramId(program, index),
  }))
}

export function findTrainingProgramEntry(
  programs: TrainingProgramRecord[] | null,
  programId: string,
): TrainingProgramEntry | null {
  if (!programs) return null
  return createTrainingProgramEntries(programs).find((entry) => entry.id === programId) ?? null
}
