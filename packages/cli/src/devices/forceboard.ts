/**
 * Device definition for the PitchSix Force Board.
 */

import { ForceBoard } from "@hangtime/grip-connect-runtime"
import pc from "picocolors"
import type { DeviceDefinition, CliDevice } from "../types.js"
import { printResult, printSuccess } from "../utils.js"

const forceboard: DeviceDefinition = {
  name: "ForceBoard",
  class: ForceBoard as unknown as new () => CliDevice,
  actions: [
    {
      name: "Battery",
      description: "Read battery level",
      run: async (device) => {
        const d = device as unknown as ForceBoard
        printResult("Battery:", await d.battery())
      },
    },
    {
      name: "Humidity",
      description: "Read humidity level",
      run: async (device) => {
        const d = device as unknown as ForceBoard
        printResult("Humidity:", await d.humidity())
      },
    },
    {
      name: "Manufacturer",
      description: "Read manufacturer info",
      run: async (device) => {
        const d = device as unknown as ForceBoard
        printResult("Manufacturer:", await d.manufacturer())
      },
    },
    {
      name: "Temperature",
      description: "Read temperature",
      run: async (device) => {
        const d = device as unknown as ForceBoard
        printResult("Temperature:", await d.temperature())
      },
    },
    {
      name: "Quick Start",
      description: "Quick Start mode (5s default)",
      run: async (device, options) => {
        const d = device as unknown as ForceBoard
        const duration = options.duration ?? 5000
        console.log(pc.cyan(`\nQuick Start running for ${duration / 1000}s...\n`))
        await d.quick(duration)
        printSuccess("Quick Start complete.")
      },
    },
    {
      name: "Threshold",
      description: "Set Quick Start threshold (lbs)",
      run: async (device) => {
        const d = device as unknown as ForceBoard
        const lbs = 10
        await d.threshold(lbs)
        printSuccess(`Threshold set to ${lbs} lbs.`)
      },
    },
    {
      name: "Tare by characteristic",
      description: "Zero calibration via characteristic",
      run: async (device) => {
        const d = device as unknown as ForceBoard
        await d.tareByCharacteristic()
        printSuccess("Tare complete.")
      },
    },
    {
      name: "Tare by mode",
      description: "Zero calibration via Device Mode",
      run: async (device) => {
        const d = device as unknown as ForceBoard
        await d.tareByMode()
        printSuccess("Tare complete.")
      },
    },
  ],
}

export default forceboard
