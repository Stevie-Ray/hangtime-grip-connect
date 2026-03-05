import type { TrainingProgramRecord } from "../../training-programs/api.js"

export interface AppState {
  isDeviceConnected: boolean
  isDeviceTared: boolean
  samplingRateDeviceKey: string | null
  samplingRateActionId: string | null
  samplingRateHz: number | null
  samplingRateChecking: boolean
  samplingRateError: string | null
  trainingPrograms: TrainingProgramRecord[] | null
  trainingProgramsLoading: boolean
  trainingProgramsError: string | null
  trainingProgramsLoadPresetNotice: string | null
}

export function createInitialAppState(): AppState {
  return {
    isDeviceConnected: false,
    isDeviceTared: false,
    samplingRateDeviceKey: null,
    samplingRateActionId: null,
    samplingRateHz: null,
    samplingRateChecking: false,
    samplingRateError: null,
    trainingPrograms: null,
    trainingProgramsLoading: false,
    trainingProgramsError: null,
    trainingProgramsLoadPresetNotice: null,
  }
}
