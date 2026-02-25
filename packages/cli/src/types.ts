/**
 * Shared type definitions for the CLI package.
 *
 * Re-exports the canonical {@link ForceMeasurement} from the runtime package
 * so every CLI module references the same full-fidelity type.
 */

import type { ForceMeasurement } from "@hangtime/grip-connect-runtime"

export type { ForceMeasurement }

/** Force unit for display (kg, lbs, or N). */
export type ForceUnit = "kg" | "lbs" | "n"
/** Supported CLI language codes. */
export type CliLanguage = "en" | "es" | "de" | "it" | "no" | "fr" | "nl"
/** Supported session export formats. */
export type ExportFormat = "csv" | "json" | "xml"

/**
 * Global output context derived from top-level CLI flags.
 *
 * Passed through to every command so formatting helpers can decide
 * between human-readable (colored) output and machine-readable JSON.
 */
export interface OutputContext {
  /** When `true`, print newline-delimited JSON instead of human text. */
  json: boolean
  /** Force unit for stream/watch output. */
  unit: ForceUnit
  /** Interactive language for labels and prompts. */
  language: CliLanguage
}

/** Per-connection interactive session state. */
export interface InteractiveSessionState {
  /** True after tare has been completed at least once for this connection. */
  isTared: boolean
}

/** Common stream options for actions that collect live data. */
export interface StreamRunOptions {
  /** Stream / tare duration in milliseconds. */
  durationMs?: number
}

/** Export options for download/session save flows. */
export interface ExportRunOptions {
  /** Export format for download. */
  format?: ExportFormat
  /** Output directory for downloaded files. */
  output?: string
}

/** Calibration-related options (device specific). */
export interface CalibrationRunOptions {
  /** Calibration reference weight in kg (legacy). */
  refWeightKg?: number
  /** Calibration curve for Progressor setCalibration (opcode 0x71). 12-byte hex string. */
  setCalibrationCurve?: string
  /** When true, run saveCalibration after Add Calibration point (Progressor). */
  saveCalibration?: boolean
}

/** Options for device-specific interactive actions when called non-interactively. */
export interface DeviceActionRunOptions {
  /** Motherboard LED color. */
  ledColor?: "green" | "red" | "orange" | "off"
  /** ForceBoard quick-start threshold in lbs. */
  thresholdLbs?: number
}

/** Peak Force session options. */
export interface PeakForceSessionOptions {
  /** Peak Force capture mode. */
  mode?: "single" | "left-right"
  /** Whether to include torque calculation in the summary. */
  includeTorque?: boolean
  /** Moment arm length in centimeters used for torque calculation. */
  momentArmCm?: number
  /** Whether to include peak force vs body weight comparison. */
  includeBodyWeightComparison?: boolean
  /** Body weight value used in comparison. */
  bodyWeight?: number
}

/** Endurance session options. */
export interface EnduranceSessionOptions {
  /** Endurance stream duration in seconds. */
  durationSeconds?: number
  /** Endurance countdown before capture starts in seconds. */
  countDownTime?: number
  /** Endurance mode. "bilateral" alternates sides, "single" captures once. */
  mode?: "single" | "bilateral"
  /** Starting side when left/right mode is enabled. */
  initialSide?: "side.left" | "side.right"
  /** Pause between left/right side captures in seconds. */
  pauseBetweenSides?: number
  /** Plot a target zone derived from MVC percentages. */
  levelsEnabled?: boolean
  /** Left maximum voluntary contraction in kilograms. */
  leftMvc?: number
  /** Right maximum voluntary contraction in kilograms. */
  rightMvc?: number
  /** Minimum target zone value as percent of MVC. */
  restLevel?: number
  /** Maximum target zone value as percent of MVC. */
  workLevel?: number
}

/** RFD session options. */
export interface RfdSessionOptions {
  /** RFD analysis mode: "20-80" (default) or time window ms (100, 150, 200, 250, 300, 1000). */
  rfdMode?: "20-80" | 100 | 150 | 200 | 250 | 300 | 1000
  /** RFD onset threshold in stream unit (default 0.5). */
  threshold?: number
  /** RFD countdown before capture starts in seconds. */
  countDownTime?: number
  /** RFD mode. "bilateral" enables left/right distribution mode. */
  mode?: "single" | "bilateral"
}

/** Repeaters session options. */
export interface RepeatersSessionOptions {
  /** Repeaters countdown before the first set in seconds. */
  countDownTime?: number
  /** Number of sets. */
  sets?: number
  /** Number of reps per set. */
  reps?: number
  /** Work time in seconds per rep. */
  repDur?: number
  /** Rest time in seconds between reps. */
  repPauseDur?: number
  /** Pause time in seconds between sets. */
  setPauseDur?: number
  /** Repeaters mode. "bilateral" alternates sides, "single" captures once. */
  mode?: "single" | "bilateral"
  /** Starting side when left/right mode is enabled. */
  initialSide?: "side.left" | "side.right"
  /** Pause between left/right side captures in seconds. */
  pauseBetweenSides?: number
  /** Plot target zone derived from MVC percentages. */
  levelsEnabled?: boolean
  /** Left maximum voluntary contraction in kilograms. */
  leftMvc?: number
  /** Right maximum voluntary contraction in kilograms. */
  rightMvc?: number
  /** Minimum target zone value as percent of MVC. */
  restLevel?: number
  /** Maximum target zone value as percent of MVC. */
  workLevel?: number
}

/** Critical Force session options. */
export interface CriticalForceSessionOptions {
  /** Critical Force countdown before protocol starts in seconds. */
  countDownTime?: number
}

/** Stream test/session specific options. */
export interface SessionRunOptions {
  peakForce?: PeakForceSessionOptions
  endurance?: EnduranceSessionOptions
  rfd?: RfdSessionOptions
  repeaters?: RepeatersSessionOptions
  criticalForce?: CriticalForceSessionOptions
}

/**
 * Options that can be forwarded to action handlers.
 *
 * Shared actions and device-specific actions receive these grouped options.
 */
export interface RunOptions {
  /** Common stream options. */
  stream?: StreamRunOptions
  /** Export options for download flow. */
  export?: ExportRunOptions
  /** Calibration options for settings/actions. */
  calibration?: CalibrationRunOptions
  /** Device action parameters for non-interactive action execution. */
  deviceAction?: DeviceActionRunOptions
  /** Per-session stream test options. */
  session?: SessionRunOptions
  /** Global output context for JSON mode. */
  ctx?: OutputContext
  /** Interactive connection-scoped state (used by stream actions/settings). */
  sessionState?: InteractiveSessionState
  /** True when called from direct CLI command flow (skip interactive start prompts). */
  nonInteractive?: boolean
}

/**
 * Minimal device shape used throughout the CLI.
 *
 * Every runtime device class satisfies this interface after being cast
 * through `unknown`.  Device-specific actions access concrete methods
 * directly in their own files so no index-signature is needed here.
 */
export interface CliDevice {
  /** Connect to the device, invoking the callback on success. */
  connect(callback: () => Promise<void>): Promise<void>
  /** Disconnect the device gracefully. */
  disconnect(): void
  /** Register a callback for incoming force measurements. Optional unit: "kg" (default), "lbs", or "n". */
  notify(callback: (data: ForceMeasurement) => void, unit?: ForceUnit): void
  /** Register an activity callback with optional threshold/duration. */
  active?(callback: (data: boolean) => void, options?: { threshold?: number; duration?: number }): void
  /** Read the battery level. */
  battery?(): Promise<string | undefined>
  /** Read the firmware version. */
  firmware?(): Promise<string | undefined>
  /** Start streaming force data for the given duration. */
  stream?(duration?: number): Promise<void>
  /** Stop an active stream. */
  stop?(): Promise<void>
  /** Export collected data in the given format. */
  download?(format?: ExportFormat): Promise<string | undefined>
  /** Run tare (zero) calibration for the given duration. */
  tare?(duration?: number): boolean
  /** Run an RFD (Rate of Force Development) capture session. */
  rfd?(
    duration?: number,
    options?: { mode?: "20-80" | 100 | 150 | 200 | 250 | 300 | 1000; threshold?: number },
  ): Promise<void>
  /** Check whether the device is currently connected. */
  isConnected?(): boolean
}

/**
 * A single action that can be performed on a connected device.
 *
 * Actions are declared statically per device so the CLI never needs
 * runtime prototype-walking. Actions with subactions show a nested menu.
 */
export interface Action {
  /** Stable identifier for logic that must not depend on translated labels. */
  actionId?: string
  /** Short display name shown in the interactive picker. */
  name: string
  /** One-line description shown next to the name. */
  description: string
  /** Optional color for the action name in the picker (e.g. "yellow" for orange). */
  nameColor?: "yellow" | "green" | "cyan" | "magenta"
  /** When true, shown in picker but not selectable (placeholder for future features). */
  disabled?: boolean
  /** Execute the action on a connected device. */
  run(device: CliDevice, options: RunOptions): Promise<void>
  /** Optional sub-actions: when present, run() shows a nested picker before delegating. */
  subactions?: Action[]
}

/**
 * Everything the CLI needs to know about a supported device.
 */
export interface DeviceDefinition {
  /** Human-readable device name. */
  name: string
  /** Runtime device constructor. */
  class: new () => CliDevice
  /** Device-specific actions (on top of the shared ones). */
  actions: Action[]
  /** Calibration subactions surfaced under Settings. */
  calibrationSubactions?: Action[]
  /** Error subactions (Get Error Info, Clear Error Info) surfaced under Settings. */
  errorSubactions?: Action[]
}
