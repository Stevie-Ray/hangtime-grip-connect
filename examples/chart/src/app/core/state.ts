import type { TrainingProgramRecord } from "../../training-programs/api.js"

export interface AppState {
  isDeviceConnected: boolean
  isDeviceTared: boolean
  trainingPrograms: TrainingProgramRecord[] | null
  trainingProgramsLoading: boolean
  trainingProgramsError: string | null
  trainingProgramsLoadPresetNotice: string | null
}

export function createInitialAppState(): AppState {
  return {
    isDeviceConnected: false,
    isDeviceTared: false,
    trainingPrograms: null,
    trainingProgramsLoading: false,
    trainingProgramsError: null,
    trainingProgramsLoadPresetNotice: null,
  }
}
