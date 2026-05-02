import type { IDevice } from "../device.interface.js"

export interface AuroraLedPlacement {
  position: number
  role_id?: number
  color?: string
}

/**
 * Interface representing an Aurora LED board device.
 */
export interface IAurora extends IDevice {
  /**
   * Configures the LEDs based on an array of climb placements.
   * @param config - Array of climb placements for the LEDs. Either role_id or color (hex string) must be provided.
   * @returns A promise that resolves with the payload array if LED settings were applied, or `undefined` if no action was taken.
   */
  led(config?: AuroraLedPlacement[]): Promise<number[] | undefined>
}
