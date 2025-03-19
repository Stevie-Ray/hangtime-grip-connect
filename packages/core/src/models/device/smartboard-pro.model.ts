import { Device } from "../device.model"
import type { ISmartBoardPro } from "../../interfaces/device/smartboard-pro.interface"

/**
 * Represents a Smartboard Climbing SmartBoard Pro device.
 * TODO: Figure out services, do you own a SmartBoard Pro? Help us!
 * {@link https://www.smartboard-climbing.com}
 */
export class SmartBoardPro extends Device implements ISmartBoardPro {
  constructor() {
    super({
      filters: [{ name: "SMARTBOARD" }],
      services: [
        {
          name: "Basic Audio Announcement",
          id: "audio",
          uuid: "00001851-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "",
              id: "",
              uuid: "0000937d-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
        {
          name: "Read + Notify",
          id: "",
          uuid: "0000403d-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "",
              id: "",
              uuid: "00001583-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
        {
          name: "Generic Attribute",
          id: "attribute",
          uuid: "00001801-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Service Changed",
              id: "service",
              uuid: "00002a05-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
      ],
    })
  }
}
