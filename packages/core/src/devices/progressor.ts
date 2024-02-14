import { Device } from "./types"

export const Progressor: Device = {
  name: "Progressor",
  services: [
    {
      name: "Progressor Service",
      id: "progressor",
      uuid: "7e4e1701-1ea6-40c9-9dcc-13d34ffead57",
      characteristics: [
        {
          name: "Notify",
          id: "rx",
          uuid: "7e4e1702-1ea6-40c9-9dcc-13d34ffead57",
        },
        {
          name: "Write",
          id: "tx",
          uuid: "7e4e1703-1ea6-40c9-9dcc-13d34ffead57",
        },
      ],
    },
    {
      name: "Secure DFU Service",
      id: "dfu",
      uuid: "0000fe59-0000-1000-8000-00805f9b34fb",
      characteristics: [
        {
          name: "Buttonless DFU",
          id: "dfu",
          uuid: "8ec90003-f315-4f60-9fb8-838830daea50",
        },
      ],
    },
  ],
}
