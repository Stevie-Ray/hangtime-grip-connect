import { Device } from "../device.model.js"
import type { ImySmartBoard } from "../../interfaces/device/mysmartboard.interface.js"

/**
 * Represents a Smartboard Climbing mySmartBoard device.
 * TODO: Add services, do you own a mySmartBoard? Help us!
 * {@link https://www.smartboard-climbing.com}
 */
export class mySmartBoard extends Device implements ImySmartBoard {
  constructor() {
    super({
      filters: [{ name: "mySmartBoard" }],
      services: [],
    })
  }
}
