import { Device } from "../device.model.js"
import type { IClimbro } from "../../interfaces/device/climbro.interface.js"

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
