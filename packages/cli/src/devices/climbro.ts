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
    {
      name: "Hardware",
      description: "Read hardware version",
      run: async (device) => {
        const d = device as unknown as Climbro
        printResult("Hardware:", await d.hardware())
      },
    },
    {
      name: "Manufacturer",
      description: "Read manufacturer info",
      run: async (device) => {
        const d = device as unknown as Climbro
        printResult("Manufacturer:", await d.manufacturer())
      },
    },
    {
      name: "Model",
      description: "Read model number",
      run: async (device) => {
        const d = device as unknown as Climbro
        printResult("Model:", await d.model())
      },
    },
    {
      name: "Software",
      description: "Read software version",
      run: async (device) => {
        const d = device as unknown as Climbro
        printResult("Software:", await d.software())
      },
    },
    {
      name: "System ID",
      description: "Read system identifier",
      run: async (device) => {
        const d = device as unknown as Climbro
        printResult("System ID:", await d.system())
      },
    },
  ],
}

export default climbro
