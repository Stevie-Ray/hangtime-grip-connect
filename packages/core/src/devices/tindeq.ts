import { Device } from "./types"

export const Tindeq: Device = {
  name: "Tindeq",
  services: [
    {
      name: "Progressor Service",
      id: "progressor",
      uuid: "7e4e1701-1ea6-40c9-9dcc-13d34ffead57",
      characteristics: [
        {
          name: "Write",
          id: "tx",
          uuid: "7e4e1703-1ea6-40c9-9dcc-13d34ffead57",
        },
        {
          name: "Notify",
          id: "rx",
          uuid: "7e4e1702-1ea6-40c9-9dcc-13d34ffead57",
        },
      ],
    },
  ],
}
