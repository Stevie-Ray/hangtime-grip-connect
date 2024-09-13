/**
 * Represents a single data packet.
 */
export interface DownloadPacket {
  /** Timestamp of when the packet was received */
  received: number
  /** Sample number */
  sampleNum: number
  /** Battery raw value */
  battRaw: number
  /** Array of sample values */
  samples: number[]
  /** Array of mass values */
  masses: number[]
}
