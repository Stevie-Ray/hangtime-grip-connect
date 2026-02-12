import type { ForceMeasurement } from "./callback.interface.js"

/**
 * Represents a single data packet for export (CSV, JSON, XML).
 * Extends ForceMeasurement with export-specific fields. Force values come from
 * `current` (single-sample) or `distribution` (multi-zone, e.g. Motherboard).
 */
export interface DownloadPacket extends ForceMeasurement {
  /** Battery raw value (device-specific, 0 when N/A) */
  battRaw?: number
  /** Raw sensor/ADC values from device */
  samples: number[]
}
