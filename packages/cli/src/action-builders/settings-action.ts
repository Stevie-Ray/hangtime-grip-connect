import select from "@inquirer/select"
import pc from "picocolors"
import { collectDeviceInfo, hasReadableDeviceInfo, renderDeviceInfo } from "../services/device-info.js"
import type { Action, CliDevice, DeviceDefinition, OutputContext, RunOptions } from "../types.js"
import { outputJson, pickAction } from "../utils.js"

/** Builds the interactive `Settings` action and its subactions. */
export function buildSettingsAction(
  device: CliDevice,
  definition: DeviceDefinition,
  ctx?: OutputContext,
): Action | undefined {
  const settingsSubactions: Action[] = []
  const currentUnit = ctx?.unit ?? "kg"

  settingsSubactions.push({
    name: `Unit (${currentUnit})`,
    description: "Set stream output to kilogram, pound, or newton",
    run: async (_device: CliDevice, options: RunOptions) => {
      const unit = await select({
        message: "Unit:",
        choices: [
          { name: "Kilogram", value: "kg" as const },
          { name: "Pound", value: "lbs" as const },
          { name: "Newton", value: "n" as const },
        ],
      })
      if (options.ctx) options.ctx.unit = unit
      if (!options.ctx?.json) console.log(pc.dim(`Force output: ${unit}`))
    },
  })

  settingsSubactions.push({
    name: "Language (English)",
    description: "CLI display language",
    run: async (_device: CliDevice, options: RunOptions) => {
      const lang = await select({
        message: "Language:",
        choices: [{ name: "English", value: "en" as const }],
      })
      if (options.ctx?.json) {
        outputJson({ language: lang })
      } else {
        console.log(pc.dim(`Language: ${lang === "en" ? "English" : lang}`))
      }
    },
  })

  if (hasReadableDeviceInfo(device)) {
    settingsSubactions.push({
      name: "System Info",
      description: "Battery, firmware, device ID, calibration, etc.",
      run: async (currentDevice: CliDevice, options: RunOptions) => {
        const info = await collectDeviceInfo(currentDevice)
        renderDeviceInfo(definition.name, info, options.ctx ?? { json: false, unit: "kg" })
      },
    })
  }

  if (definition.calibrationSubactions?.length) {
    settingsSubactions.push({
      name: "Calibration",
      description: "Get curve, set curve, or add calibration points",
      run: async (currentDevice: CliDevice, options: RunOptions) => {
        const sub = await pickAction(definition.calibrationSubactions ?? [])
        await sub.run(currentDevice, options)
      },
    })
  }

  if (definition.errorSubactions?.length) {
    settingsSubactions.push({
      name: "Errors",
      description: "Get or clear error information",
      run: async (currentDevice: CliDevice, options: RunOptions) => {
        const sub = await pickAction(definition.errorSubactions ?? [])
        await sub.run(currentDevice, options)
      },
    })
  }

  settingsSubactions.push({
    name: "Return",
    description: "Go back to main menu",
    // eslint-disable-next-line @typescript-eslint/no-empty-function -- Return is a no-op, resumes action loop
    run: async () => {},
  })

  if (settingsSubactions.length === 0) return undefined

  return {
    name: "Settings",
    description: "Unit, language, system info, calibration, errors",
    run: async (currentDevice: CliDevice, options: RunOptions) => {
      const sub = await pickAction(settingsSubactions)
      await sub.run(currentDevice, options)
    },
  }
}
