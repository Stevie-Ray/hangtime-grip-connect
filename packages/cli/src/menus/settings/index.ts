import { hasReadableDeviceInfo } from "../../services/device-info.js"
import type { Action, CliDevice, DeviceDefinition, OutputContext } from "../../types.js"
import { pickAction } from "../../utils.js"
import { buildCalibrationSettingsAction } from "./calibration.js"
import { buildErrorsSettingsAction } from "./errors.js"
import { buildLanguageSettingsAction } from "./language.js"
import { buildReturnSettingsAction } from "./return.js"
import { buildSystemInfoSettingsAction } from "./system-info.js"
import { buildTareSettingsAction } from "./tare.js"
import { buildUnitSettingsAction } from "./unit.js"

/** Builds the interactive `Settings` action and its subactions. */
export function buildSettingsAction(
  device: CliDevice,
  definition: DeviceDefinition,
  ctx?: OutputContext,
): Action | undefined {
  const settingsSubactions: Action[] = []
  const currentUnit = ctx?.unit ?? "kg"

  settingsSubactions.push(buildUnitSettingsAction(currentUnit))
  const tareAction = buildTareSettingsAction(device)
  if (tareAction) {
    settingsSubactions.push(tareAction)
  }
  settingsSubactions.push(buildLanguageSettingsAction())

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

  if (settingsSubactions.length === 0) return undefined

  return {
    name: "Settings",
    description: "Unit, tare, language, system info, calibration, errors",
    run: async (currentDevice: CliDevice, options) => {
      const sub = await pickAction(settingsSubactions)
      await sub.run(currentDevice, options)
    },
  }
}
