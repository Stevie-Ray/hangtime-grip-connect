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
  /** When `true`, stream indefinitely until interrupted. */
  watch?: boolean
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
  countdownSeconds?: number
}

/** RFD session options. */
export interface RfdSessionOptions {
  /** RFD analysis mode: "20-80" (default) or time window ms (100, 150, 200, 250, 300, 1000). */
  mode?: "20-80" | 100 | 150 | 200 | 250 | 300 | 1000
  /** RFD onset threshold in stream unit (default 0.5). */
  threshold?: number
  /** RFD countdown before capture starts in seconds. */
  countdownSeconds?: number
  /** When true, RFD session is configured to use left/right distribution mode. */
  leftRightMode?: boolean
}

/** Repeaters session options. */
export interface RepeatersSessionOptions {
  /** Repeaters countdown before the first set in seconds. */
  countdownSeconds?: number
}

/** Critical Force session options. */
export interface CriticalForceSessionOptions {
  /** Critical Force countdown before protocol starts in seconds. */
  countdownSeconds?: number
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
  download?(format?: ExportFormat): Promise<void>
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
