/**
 * Device definition for the Jlyscales CTS500.
 */

import select from "@inquirer/select"
import { CTS500 } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"
import { printResult, printSuccess } from "../utils.js"

const cts500: DeviceDefinition = {
  name: "CTS500",
  class: CTS500 as unknown as new () => CliDevice,
  actions: [
    {
      name: "Battery",
      description: "Read battery voltage",
      run: async (device) => {
        const d = device as unknown as CTS500
        printResult("Battery:", await d.battery())
      },
    },
    {
      name: "Firmware",
      description: "Read firmware version",
      run: async (device) => {
        const d = device as unknown as CTS500
        printResult("Firmware:", await d.firmware())
      },
    },
    {
      name: "Hardware",
      description: "Read hardware version",
      run: async (device) => {
        const d = device as unknown as CTS500
        printResult("Hardware:", await d.hardware())
      },
    },
    {
      name: "Manufacturer",
      description: "Read manufacturer info",
      run: async (device) => {
        const d = device as unknown as CTS500
        printResult("Manufacturer:", await d.manufacturer())
      },
    },
    {
      name: "Model",
      description: "Read model number",
      run: async (device) => {
        const d = device as unknown as CTS500
        printResult("Model:", await d.model())
      },
    },
    {
      name: "Serial",
      description: "Read serial number",
      run: async (device) => {
        const d = device as unknown as CTS500
        printResult("Serial:", await d.serial())
      },
    },
    {
      name: "Software",
      description: "Read software version",
      run: async (device) => {
        const d = device as unknown as CTS500
        printResult("Software:", await d.software())
      },
    },
    {
      name: "Temperature",
      description: "Read temperature",
      run: async (device) => {
        const d = device as unknown as CTS500
        printResult("Temperature:", await d.temperature())
      },
    },
    {
      name: "Weight",
      description: "Read current weight",
      run: async (device) => {
        const d = device as unknown as CTS500
        const weight = await d.weight()
        printResult("Weight:", weight != null ? `${weight} kg` : undefined)
      },
    },
    {
      name: "Zero",
      description: "Update the hardware zero point",
      run: async (device) => {
        const d = device as unknown as CTS500
        await d.zero()
        printSuccess("Zero point updated.")
      },
    },
    {
      name: "Power On Reset",
      description: "Toggle reset-to-zero on startup",
      run: async (device) => {
        const d = device as unknown as CTS500
        const enabled = await select<boolean>({
          message: "Enable power-on reset?",
          choices: [
            { name: "Enable", value: true },
            { name: "Disable", value: false },
          ],
        })
        await d.powerOnReset(enabled)
        printSuccess(`Power-on reset ${enabled ? "enabled" : "disabled"}.`)
      },
    },
    {
      name: "Peak Mode",
      description: "Toggle peak mode",
      run: async (device) => {
        const d = device as unknown as CTS500
        const enabled = await select<boolean>({
          message: "Enable peak mode?",
          choices: [
            { name: "Enable", value: true },
            { name: "Disable", value: false },
          ],
        })
        await d.peakMode(enabled)
        printSuccess(`Peak mode ${enabled ? "enabled" : "disabled"}.`)
      },
    },
    {
      name: "Set Baud Rate",
      description: "Configure UART baud rate",
      run: async (device) => {
        const d = device as unknown as CTS500
        const baudRate = await select<9600 | 19200 | 38400 | 57600 | 115200>({
          message: "Select baud rate:",
          choices: [
            { name: "9600", value: 9600 },
            { name: "19200", value: 19200 },
            { name: "38400", value: 38400 },
            { name: "57600", value: 57600 },
            { name: "115200", value: 115200 },
          ],
        })
        await d.setBaudRate(baudRate)
        printSuccess(`Baud rate set to ${baudRate}.`)
      },
    },
    {
      name: "Set Sampling Rate",
      description: "Configure A/D sampling rate",
      run: async (device) => {
        const d = device as unknown as CTS500
        const samplingRate = await select<10 | 20 | 40 | 80 | 160 | 320>({
          message: "Select sampling rate:",
          choices: [
            { name: "10 Hz", value: 10 },
            { name: "20 Hz", value: 20 },
            { name: "40 Hz", value: 40 },
            { name: "80 Hz", value: 80 },
            { name: "160 Hz", value: 160 },
            { name: "320 Hz", value: 320 },
          ],
        })
        await d.setSamplingRate(samplingRate)
        printSuccess(`Sampling rate set to ${samplingRate} Hz.`)
      },
    },
  ],
}

export default cts500
