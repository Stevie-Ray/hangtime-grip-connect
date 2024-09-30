import { Device } from "../device.model"
import type { ImySmartBoard } from "../../interfaces/device/mysmartboard.interface"

/**
 * Represents a mySmartBoard device
 * TODO: Add services, do you own a mySmartBoard? Help us!
 */
export class mySmartBoard extends Device implements ImySmartBoard {
  constructor() {
    super({
      filters: [{ name: "mySmartBoard" }],
      services: [],
    })
  }
}
