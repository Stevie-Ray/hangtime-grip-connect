import { Device } from "../device.model"

/**
 * Represents a mySmartBoard device
 * TODO: Add services, do you own a mySmartBoard? Help us!
 */
export class mySmartBoard extends Device {
  constructor() {
    super({
      filters: [{ name: "mySmartBoard" }],
      services: [],
    })
  }
}
