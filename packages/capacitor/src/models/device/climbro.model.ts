import { Device } from "../device.model"
import type { IClimbro } from "@hangtime/grip-connect/src/interfaces/device/climbro.interface"

/**
 * Represents a Climbro device.
 * TODO: Add services, do you own a Climbro? Help us!
 * {@link https://climbro.com/}
 */
export class Climbro extends Device implements IClimbro {
  constructor() {
    super({
      filters: [{ name: "Climbro" }],
      services: [],
    })
  }
}
