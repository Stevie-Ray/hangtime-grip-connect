import { Device } from "../device.model"

/**
 * Represents a Climbro device
 * TODO: Add services, do you own a Climbro? Help us!
 */
export class Climbro extends Device {
  constructor() {
    super({
      filters: [{ name: "Climbro" }],
      services: [],
    })
  }
}
