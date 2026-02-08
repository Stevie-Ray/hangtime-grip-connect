/**
 * Device definition for the Griptonite Motherboard.
 */

import select from "@inquirer/select"
import pc from "picocolors"
import { Motherboard } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"
import { printResult, printSuccess } from "../utils.js"

const motherboard: DeviceDefinition = {
  name: "Motherboard",
  class: Motherboard as unknown as new () => CliDevice,
  actions: [
    {
      name: "Battery",
      description: "Read battery level",
      run: async (device) => {
        const d = device as unknown as Motherboard
        printResult("Battery:", await d.battery())
      },
    },
    {
      name: "Calibration",
      description: "Request calibration data",
      run: async (device) => {
        const d = device as unknown as Motherboard
        await d.calibration()
        printSuccess("Calibration data requested.")
      },
    },
    {
      name: "Firmware",
      description: "Read firmware version",
      run: async (device) => {
        const d = device as unknown as Motherboard
        printResult("Firmware:", await d.firmware())
      },
    },
    {
      name: "Hardware",
      description: "Read hardware version",
      run: async (device) => {
        const d = device as unknown as Motherboard
        printResult("Hardware:", await d.hardware())
      },
    },
    {
      name: "LED",
      description: "Set LED color (green / red / orange / off)",
      run: async (device) => {
        const d = device as unknown as Motherboard
        const color = await select<"green" | "red" | "orange" | "off">({
          message: "LED color:",
          choices: [
            { name: "Green", value: "green" },
            { name: "Red", value: "red" },
            { name: "Orange", value: "orange" },
            { name: "Off", value: "off" },
          ],
        })
        await d.led(color === "off" ? undefined : color)
        printSuccess(`LED set to ${color}.`)
      },
    },
    {
      name: "Manufacturer",
      description: "Read manufacturer info",
      run: async (device) => {
        const d = device as unknown as Motherboard
        printResult("Manufacturer:", await d.manufacturer())
      },
    },
    {
      name: "Serial",
      description: "Read serial number",
      run: async (device) => {
        const d = device as unknown as Motherboard
        printResult("Serial:", await d.serial())
      },
    },
    {
      name: "Text",
      description: "Read device text memory",
      run: async (device) => {
        const d = device as unknown as Motherboard
        const text = await d.text()
        if (text) {
          console.log(pc.cyan(`\nText memory:\n${text}`))
        } else {
          console.log(pc.dim("\nNo text data."))
        }
      },
    },
  ],
}

export default motherboard
