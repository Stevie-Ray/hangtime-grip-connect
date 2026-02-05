/**
 * Device definition for the Climbro hangboard.
 */

import { Climbro } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"
import { printResult } from "../utils.js"

const climbro: DeviceDefinition = {
  name: "Climbro",
  class: Climbro as unknown as new () => CliDevice,
  actions: [
    {
      name: "Battery",
      description: "Read battery level",
      run: async (device) => {
        const d = device as unknown as Climbro
        printResult("Battery:", await d.battery())
      },
    },
  ],
}

export default climbro
