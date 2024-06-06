export interface massObject {
  /** The total mass. */
  massTotal: string
  /**  The total maximum mass. */
  massMax: string
  /** The total average mass. */
  massAverage: string
  /** The mass on the left side (optional: Motherboard). */
  massLeft?: string
  /** The mass at the center (optional: Motherboard). */
  massCenter?: string
  /** The mass on the right side (optional: Motherboard). */
  massRight?: string
}
