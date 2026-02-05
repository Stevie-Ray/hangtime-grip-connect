/**
 * Device definition for the PB-700BT dynamometer.
 */

import { PB700BT } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"
import { printResult } from "../utils.js"

const pb700bt: DeviceDefinition = {
  name: "PB-700BT",
  class: PB700BT as unknown as new () => CliDevice,
  actions: [
    {
      name: "Battery",
      description: "Read battery level",
      run: async (device) => {
        const d = device as unknown as PB700BT
        printResult("Battery:", await d.battery())
      },
    },
    {
      name: "Certification",
      description: "Read certification info",
      run: async (device) => {
        const d = device as unknown as PB700BT
        printResult("Certification:", await d.certification())
      },
    },
    {
      name: "Firmware",
      description: "Read firmware version",
      run: async (device) => {
        const d = device as unknown as PB700BT
        printResult("Firmware:", await d.firmware())
      },
    },
    {
      name: "Hardware",
      description: "Read hardware version",
      run: async (device) => {
        const d = device as unknown as PB700BT
        printResult("Hardware:", await d.hardware())
      },
    },
    {
      name: "Manufacturer",
      description: "Read manufacturer info",
      run: async (device) => {
        const d = device as unknown as PB700BT
        printResult("Manufacturer:", await d.manufacturer())
      },
    },
    {
      name: "Model",
      description: "Read model number",
      run: async (device) => {
        const d = device as unknown as PB700BT
        printResult("Model:", await d.model())
      },
    },
    {
      name: "PnP ID",
      description: "Read PnP identifier",
      run: async (device) => {
        const d = device as unknown as PB700BT
        printResult("PnP ID:", await d.pnp())
      },
    },
    {
      name: "Software",
      description: "Read software version",
      run: async (device) => {
        const d = device as unknown as PB700BT
        printResult("Software:", await d.software())
      },
    },
    {
      name: "System ID",
      description: "Read system identifier",
      run: async (device) => {
        const d = device as unknown as PB700BT
        printResult("System ID:", await d.system())
      },
    },
  ],
}

export default pb700bt
