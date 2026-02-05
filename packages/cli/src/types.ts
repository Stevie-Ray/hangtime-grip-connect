/**
 * Shared type definitions for the CLI package.
 *
 * Re-exports the canonical {@link ForceMeasurement} from the core library
 * so every CLI module references the same full-fidelity type.
 */

import type { ForceMeasurement } from "@hangtime/grip-connect"

export type { ForceMeasurement }

/**
 * Global output context derived from top-level CLI flags.
 *
 * Passed through to every command so formatting helpers can decide
 * between human-readable (colored) output and machine-readable JSON.
 */
export interface OutputContext {
  /** When `true`, print newline-delimited JSON instead of human text. */
  json: boolean
}

/**
 * Options that can be forwarded to action handlers.
 *
 * Shared actions and device-specific actions receive these so they can
 * respect user-provided flags such as duration, export format, and output
 * directory.
 */
export interface RunOptions {
  /** Stream / tare duration in milliseconds. */
  duration?: number
  /** Export format for download. */
  format?: "csv" | "json" | "xml"
  /** Output directory for downloaded files. */
  output?: string
  /** When `true`, stream indefinitely until interrupted. */
  watch?: boolean
  /** Global output context for JSON mode. */
  ctx?: OutputContext
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
  /** Register a callback for incoming force measurements. */
  notify(callback: (data: ForceMeasurement) => void): void
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
  download?(format?: "csv" | "json" | "xml"): Promise<void>
  /** Run tare (zero) calibration for the given duration. */
  tare?(duration?: number): boolean
  /** Check whether the device is currently connected. */
  isConnected?(): boolean
}

/**
 * A single action that can be performed on a connected device.
 *
 * Actions are declared statically per device so the CLI never needs
 * runtime prototype-walking.
 */
export interface Action {
  /** Short display name shown in the interactive picker. */
  name: string
  /** One-line description shown next to the name. */
  description: string
  /** Execute the action on a connected device. */
  run(device: CliDevice, options: RunOptions): Promise<void>
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
}
