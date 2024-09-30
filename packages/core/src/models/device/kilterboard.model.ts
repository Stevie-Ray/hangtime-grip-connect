import { Device } from "../device.model"
import type { IKilterBoard } from "../../interfaces/device/kilterboard.interface"

/**
 * Aurora Climbing Advertising service
 */
export const AuroraUUID = "4488b571-7806-4df6-bcff-a2897e4953ff"

/**
 * Represents a Aurora Climbing device
 * Kilter Board, Tension Board, Decoy Board, Touchstone Board, Grasshopper Board, Aurora Board, So iLL Board
 */
export class KilterBoard extends Device implements IKilterBoard {
  constructor() {
    super({
      filters: [
        {
          services: [AuroraUUID],
        },
      ],
      services: [
        {
          name: "UART Nordic Service",
          id: "uart",
          uuid: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
          characteristics: [
            {
              name: "TX",
              id: "tx",
              uuid: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
            },
            // {
            //   name: "RX",
            //   id: "rx",
            //   uuid: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
            // },
          ],
        },
      ],
    })
  }
}
