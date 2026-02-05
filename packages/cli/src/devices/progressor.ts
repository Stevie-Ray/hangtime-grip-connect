/**
 * Device definition for the Tindeq Progressor.
 */

import { Progressor } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"
import { printResult, printSuccess } from "../utils.js"

const progressor: DeviceDefinition = {
  name: "Progressor",
  class: Progressor as unknown as new () => CliDevice,
  actions: [
    {
      name: "Battery",
      description: "Read battery level",
      run: async (device) => {
        const d = device as unknown as Progressor
        printResult("Battery:", await d.battery())
      },
    },
    {
      name: "Firmware",
      description: "Read firmware version",
      run: async (device) => {
        const d = device as unknown as Progressor
        printResult("Firmware:", await d.firmware())
      },
    },
    {
      name: "Stop",
      description: "Stop current stream",
      run: async (device) => {
        const d = device as unknown as Progressor
        await d.stop()
        printSuccess("Stream stopped.")
      },
    },
  ],
}

export default progressor
