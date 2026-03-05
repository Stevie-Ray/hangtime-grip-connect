import { getActiveDevice } from "../../devices/session.js"
import { runSettingsAction, type SettingsActionId } from "../../settings/actions.js"
import type { AppState } from "../core/state.js"

export function updateSettingsFeedback(appElement: HTMLDivElement, status: string, output?: string): void {
  const statusElement = appElement.querySelector<HTMLElement>("#settings-status")
  const outputElement = appElement.querySelector<HTMLElement>("#settings-device-output")
  if (statusElement) statusElement.textContent = status
  if (outputElement && output != null) outputElement.textContent = output
}

export function executeSettingsAction(appElement: HTMLDivElement, state: AppState, action: SettingsActionId): void {
  void runSettingsAction({
    action,
    appElement,
    device: getActiveDevice(),
    setFeedback: (status, output) => updateSettingsFeedback(appElement, status, output),
    onTareStarted: () => {
      state.isDeviceTared = true
    },
  })
}
