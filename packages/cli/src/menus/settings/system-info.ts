import { collectDeviceInfo, renderDeviceInfo } from "../../services/device-info.js"
import type { Action, CliDevice, RunOptions } from "../../types.js"

export function buildSystemInfoSettingsAction(deviceName: string): Action {
  return {
    name: "System Info",
    description: "Battery, firmware, device ID, calibration, etc.",
    run: async (currentDevice: CliDevice, options: RunOptions) => {
      const info = await collectDeviceInfo(currentDevice)
      renderDeviceInfo(deviceName, info, options.ctx ?? { json: false, unit: "kg" })
    },
  }
}
