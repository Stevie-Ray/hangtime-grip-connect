import React from "react"
import { DeviceType } from "@/components/DevicePicker"

interface Hold {
  name: string
  depth: string
}

interface AppSettings {
  activeHold: Hold | null
  holds: Hold[]
  weighThreshold: number
  beep: boolean
  deviceType: DeviceType | ""
}

interface SettingsProviderProps {
  children: React.ReactNode
}

interface WorkoutResults {
  left: number
  right: number
  both: number
  mode: string
  time?: string
  date?: string
  hold?: Hold
}

interface ConnectionStatusBarProps {
  isConnected: boolean
  error?: string
}

interface HoldsModalProps {
  onClose: () => void
  onSave: (hold: Hold) => void
}

interface MeasureProps {
  save: boolean
  finishWorkout: (save: boolean, results: WorkoutResults) => void
}
