import { buildSettingsAction } from "./action-builders/settings-action.js"
import { buildStreamActions } from "./action-builders/stream-actions.js"
import { buildTareAction } from "./action-builders/tare-action.js"
import { devices } from "./devices/index.js"
import type { Action, CliDevice, OutputContext, RunOptions } from "./types.js"
import { printSuccess } from "./utils.js"

/**
 * Build interactive actions for a selected device.
 * Shared actions come first, then device-specific actions, then Disconnect.
 */
export function buildActions(deviceKey: string, ctx?: OutputContext): Action[] {
  const key = deviceKey.toLowerCase()
  const definition = devices[key]
  if (!definition) return []

  const device = new definition.class() as unknown as CliDevice
  const sharedActions: Action[] = []

  if (typeof device.stream === "function") {
    sharedActions.push(...buildStreamActions())
  }

  const settingsAction = buildSettingsAction(device, definition, ctx)
  if (settingsAction) {
    sharedActions.push(settingsAction)
  }

  const tareAction = buildTareAction(device)
  if (tareAction) {
    sharedActions.push(tareAction)
  }

  const disconnectAction: Action = {
    name: "Disconnect",
    description: "Disconnect from current device and pick another",
    run: async (_device: CliDevice, options: RunOptions) => {
      if (!options.ctx?.json) {
        printSuccess("Disconnected. You can pick another device.")
      }
    },
  }

  return [...sharedActions, ...definition.actions, disconnectAction]
}
