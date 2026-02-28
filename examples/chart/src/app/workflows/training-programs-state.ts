import type { TrainingProgramRecord } from "../../training-programs/api.js"
import { fetchTrainingPrograms, hasTrainingProgramsEnv, pickTrainingProgramId } from "../../training-programs/api.js"
import { saveConfig } from "../../protocols/storage.js"
import type { AppState } from "../core/state.js"

function parseRepeatersPreset(preset: unknown): {
  countDownTime: number
  sets: number
  reps: number
  repDur: number
  repPauseDur: number
  setPauseDur: number
  mode: "single" | "bilateral"
  initialSide: "side.left" | "side.right"
  pauseBetweenSides: number
  levelsEnabled: boolean
  leftMvc: number
  rightMvc: number
  restLevel: number
  workLevel: number
} | null {
  if (typeof preset !== "object" || preset === null) return null
  const raw = preset as Record<string, unknown>

  const parseIntMin = (value: unknown, min: number, fallback: number): number => {
    const n = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(n)) return fallback
    return Math.max(min, Math.trunc(n))
  }
  const parseNumberMin = (value: unknown, min: number, fallback: number): number => {
    const n = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(n)) return fallback
    return Math.max(min, n)
  }

  const rawRestLevel = parseIntMin(raw["restLevel"], 0, 40)
  const rawWorkLevel = parseIntMin(raw["workLevel"], 0, 80)
  const restLevel = Math.min(rawRestLevel, rawWorkLevel)
  const workLevel = Math.max(rawRestLevel, rawWorkLevel)

  return {
    countDownTime: parseIntMin(raw["countDownTime"], 0, 3),
    sets: parseIntMin(raw["sets"], 1, 3),
    reps: parseIntMin(raw["reps"], 1, 12),
    repDur: parseIntMin(raw["repDur"], 1, 10),
    repPauseDur: parseIntMin(raw["repPauseDur"], 0, 6),
    setPauseDur: parseIntMin(raw["setPauseDur"], 0, 8 * 60),
    mode: raw["mode"] === "bilateral" ? "bilateral" : "single",
    initialSide: raw["initialSide"] === "side.right" ? "side.right" : "side.left",
    pauseBetweenSides: parseIntMin(raw["pauseBetweenSides"], 0, 10),
    levelsEnabled: Boolean(raw["levelsEnabled"]),
    leftMvc: parseNumberMin(raw["leftMvc"], 0, 0),
    rightMvc: parseNumberMin(raw["rightMvc"], 0, 0),
    restLevel,
    workLevel,
  }
}

function findTrainingProgramById(
  trainingPrograms: TrainingProgramRecord[] | null,
  programId: string,
): TrainingProgramRecord | null {
  if (!trainingPrograms) return null
  const entry = trainingPrograms
    .map((program, index) => ({ program, id: pickTrainingProgramId(program, index) }))
    .find((item) => item.id === programId)
  return entry?.program ?? null
}

interface TrainingProgramStateOptions {
  state: AppState
  render: () => Promise<void>
}

export function createTrainingProgramState(options: TrainingProgramStateOptions) {
  const { state, render } = options

  const loadTrainingPrograms = async (forceRefresh = false): Promise<void> => {
    if (!hasTrainingProgramsEnv()) return
    if (state.trainingProgramsLoading) return
    if (state.trainingPrograms != null && !forceRefresh) return

    state.trainingProgramsLoading = true
    state.trainingProgramsError = null
    if (forceRefresh) {
      state.trainingProgramsLoadPresetNotice = null
    }
    void render()

    try {
      state.trainingPrograms = await fetchTrainingPrograms(forceRefresh)
    } catch (error: unknown) {
      state.trainingProgramsError = error instanceof Error ? error.message : "Failed to load training programs."
    } finally {
      state.trainingProgramsLoading = false
    }

    void render()
  }

  const loadTrainingProgramPreset = (programId: string): { ok: boolean; navigateTo?: string } => {
    const program = findTrainingProgramById(state.trainingPrograms, programId)
    if (!program) {
      state.trainingProgramsLoadPresetNotice = "Training program not found."
      return { ok: false }
    }

    const preset = parseRepeatersPreset(program["repeatersPreset"])
    if (!preset) {
      state.trainingProgramsLoadPresetNotice = "No repeaters preset found for this training program."
      return { ok: false }
    }

    saveConfig("repeaters", preset)
    state.trainingProgramsLoadPresetNotice = null
    return { ok: true, navigateTo: "?route=repeaters&screen=new-session" }
  }

  return {
    loadTrainingPrograms,
    loadTrainingProgramPreset,
  }
}
