import type { Device } from "../types/devices"

/**
 * Represents a Aurora Climbing device
 * Kilter Board, Tension Board, Decoy Board, Touchstone Board, Grasshopper Board, Aurora Board, So iLL Board
 */
export const KilterBoard: Device = {
  filters: [
    {
      services: ["4488b571-7806-4df6-bcff-a2897e4953ff"], // Aurora Climbing Advertising service
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
}
