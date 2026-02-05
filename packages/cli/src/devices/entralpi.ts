/**
 * Device definition for the Entralpi hangboard.
 */

import { Entralpi } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"
import { printResult } from "../utils.js"

const entralpi: DeviceDefinition = {
  name: "Entralpi",
  class: Entralpi as unknown as new () => CliDevice,
  actions: [
    {
      name: "Battery",
      description: "Read battery level",
      run: async (device) => {
        const d = device as unknown as Entralpi
        printResult("Battery:", await d.battery())
      },
    },
    {
      name: "Certification",
      description: "Read certification info",
      run: async (device) => {
        const d = device as unknown as Entralpi
        printResult("Certification:", await d.certification())
      },
    },
    {
      name: "Firmware",
      description: "Read firmware version",
      run: async (device) => {
        const d = device as unknown as Entralpi
        printResult("Firmware:", await d.firmware())
      },
    },
    {
      name: "Hardware",
      description: "Read hardware version",
      run: async (device) => {
        const d = device as unknown as Entralpi
        printResult("Hardware:", await d.hardware())
      },
    },
    {
      name: "Manufacturer",
      description: "Read manufacturer info",
      run: async (device) => {
        const d = device as unknown as Entralpi
        printResult("Manufacturer:", await d.manufacturer())
      },
    },
    {
      name: "Model",
      description: "Read model number",
      run: async (device) => {
        const d = device as unknown as Entralpi
        printResult("Model:", await d.model())
      },
    },
    {
      name: "PnP ID",
      description: "Read PnP identifier",
      run: async (device) => {
        const d = device as unknown as Entralpi
        printResult("PnP ID:", await d.pnp())
      },
    },
    {
      name: "Software",
      description: "Read software version",
      run: async (device) => {
        const d = device as unknown as Entralpi
        printResult("Software:", await d.software())
      },
    },
    {
      name: "System ID",
      description: "Read system identifier",
      run: async (device) => {
        const d = device as unknown as Entralpi
        printResult("System ID:", await d.system())
      },
    },
  ],
}

export default entralpi
