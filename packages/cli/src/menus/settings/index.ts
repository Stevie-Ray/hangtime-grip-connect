import { hasReadableDeviceInfo } from "../../services/device-info.js"
import type { Action, CliDevice, DeviceDefinition, OutputContext } from "../../types.js"
import { pickAction } from "../../utils.js"
import { localizeInteractiveActions } from "../interactive/translations.js"
import { buildCalibrationSettingsAction } from "./calibration.js"
import { buildErrorsSettingsAction } from "./errors.js"
import { buildLanguageSettingsAction } from "./language.js"
import { buildReturnSettingsAction } from "./return.js"
import { buildSystemInfoSettingsAction } from "./system-info.js"
import { buildTareSettingsAction } from "./tare.js"
import { buildUnitSettingsAction } from "./unit.js"

function buildSettingsSubactions(device: CliDevice, definition: DeviceDefinition, ctx?: OutputContext): Action[] {
  const settingsSubactions: Action[] = []
  const currentUnit = ctx?.unit ?? "kg"

  settingsSubactions.push(buildUnitSettingsAction(currentUnit))
  const tareAction = buildTareSettingsAction(device)
  if (tareAction) {
    settingsSubactions.push(tareAction)
  }
  settingsSubactions.push(buildLanguageSettingsAction(ctx?.language ?? "en"))

  if (hasReadableDeviceInfo(device)) {
    settingsSubactions.push(buildSystemInfoSettingsAction(definition.name))
  }

  if (definition.calibrationSubactions?.length) {
    settingsSubactions.push(buildCalibrationSettingsAction(definition.calibrationSubactions))
  }

  if (definition.errorSubactions?.length) {
    settingsSubactions.push(buildErrorsSettingsAction(definition.errorSubactions))
  }

  settingsSubactions.push(buildReturnSettingsAction())

  return settingsSubactions
}

/** Builds the interactive `Settings` action and its subactions. */
export function buildSettingsAction(
  device: CliDevice,
  definition: DeviceDefinition,
  ctx?: OutputContext,
): Action | undefined {
  const settingsSubactions = buildSettingsSubactions(device, definition, ctx)
  if (settingsSubactions.length === 0) return undefined

  return {
    actionId: "settings",
    name: "Settings",
    description: "Unit, tare, language, system info, calibration, errors",
    subactions: buildSettingsSubactions(device, definition, ctx),
    run: async (currentDevice: CliDevice, options) => {
      while (true) {
        const liveCtx = options.ctx ?? ctx
        const localizedSubactions = localizeInteractiveActions(
          buildSettingsSubactions(currentDevice, definition, liveCtx),
          liveCtx?.language ?? "en",
        )
        const sub = await pickAction(localizedSubactions)
        await sub.run(currentDevice, options)
        if (sub.actionId === "settings-return") {
          return
        }
      }
    },
  }
}
