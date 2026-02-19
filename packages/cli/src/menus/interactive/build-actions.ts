import { devices } from "../../devices/index.js"
import { buildSettingsAction } from "../settings/index.js"
import { buildStreamActionsList } from "../stream-actions/index.js"
import type { Action, CliDevice, OutputContext, RunOptions } from "../../types.js"
import { printSuccess } from "../../utils.js"

/**
 * Build interactive actions for a selected device.
 * Shared actions come first, then device-specific actions, then Disconnect.
 */
export function buildInteractiveActions(deviceKey: string, ctx?: OutputContext): Action[] {
  const key = deviceKey.toLowerCase()
  const definition = devices[key]
  if (!definition) return []

  const device = new definition.class() as unknown as CliDevice
  const sharedActions: Action[] = []

  if (typeof device.stream === "function") {
    sharedActions.push(...buildStreamActionsList())
  }

  const settingsAction = buildSettingsAction(device, definition, ctx)
  if (settingsAction) {
    sharedActions.push(settingsAction)
  }

  const disconnectAction: Action = {
    name: "Disconnect",
    description: "Disconnect from current device and pick another",
    run: async (currentDevice: CliDevice, options: RunOptions) => {
      if (key === "progressor") {
        const sleepFn = (currentDevice as { sleep?: () => Promise<void> }).sleep
        if (typeof sleepFn === "function") {
          await sleepFn()
        }
      }
      if (!options.ctx?.json) {
        printSuccess("Disconnected. You can pick another device.")
      }
    },
  }

  return [...sharedActions, ...definition.actions, disconnectAction]
}
