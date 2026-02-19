import select from "@inquirer/select"
import { devices } from "../../devices/index.js"
import type { CliDevice } from "../../types.js"
import { fail } from "../../utils.js"

/** Prompt for a device from the interactive device list. */
export async function pickInteractiveDevice(): Promise<string> {
  return select({
    message: "Select a device:",
    choices: Object.entries(devices).map(([key, def]) => {
      const disabled = key === "wh-c06"
      return {
        name: disabled ? `${def.name}` : def.name,
        value: key,
        ...(disabled && { disabled: true }),
      }
    }),
  })
}

/** Create the selected device from the device registry. */
export function createInteractiveDevice(deviceKey: string): { device: CliDevice; name: string } {
  const key = deviceKey.toLowerCase()
  const definition = devices[key]
  if (!definition) {
    fail(`Unknown device: ${deviceKey}\nRun 'grip-connect list' to see supported devices.`)
  }
  return { device: new definition.class() as unknown as CliDevice, name: definition.name }
}
