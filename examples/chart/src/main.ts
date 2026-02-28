import "./style.css"
import { setupFontAwesome } from "./ui/icons.js"
import { registerAppEvents } from "./app/core/events.js"
import { renderApp } from "./app/core/render-app.js"
import { createInitialAppState } from "./app/core/state.js"
import { syncNewSessionOptionVisibility } from "./app/workflows/new-session-options.js"
import { ensureOneTimeTareForSession } from "./app/workflows/session-tare.js"
import { executeSettingsAction, updateSettingsFeedback } from "./app/workflows/settings-feedback.js"
import { createTrainingProgramState } from "./app/workflows/training-programs-state.js"

const appElement = document.querySelector<HTMLDivElement>("#app")
if (!appElement) {
  throw new Error("Missing #app root element.")
}

setupFontAwesome()

const state = createInitialAppState()

let renderCurrent = async (): Promise<void> => undefined

const trainingProgramsState = createTrainingProgramState({
  state,
  render: async () => renderCurrent(),
})

const executeCurrentSettingsAction = (action: Parameters<typeof executeSettingsAction>[2]): void => {
  executeSettingsAction(appElement, state, action)
}

const syncCurrentSessionOptionVisibility = (): void => {
  syncNewSessionOptionVisibility(appElement)
}

const ensureCurrentOneTimeTare = async (): Promise<boolean> => ensureOneTimeTareForSession(state)

renderCurrent = async (): Promise<void> => {
  await renderApp({
    appElement,
    state,
    ensureOneTimeTareForSession: ensureCurrentOneTimeTare,
    executeSettingsAction: executeCurrentSettingsAction,
    syncNewSessionOptionVisibility: syncCurrentSessionOptionVisibility,
    loadTrainingPrograms: async () => trainingProgramsState.loadTrainingPrograms(),
  })
}

registerAppEvents({
  appElement,
  state,
  render: async () => renderCurrent(),
  executeSettingsAction: executeCurrentSettingsAction,
  syncNewSessionOptionVisibility: syncCurrentSessionOptionVisibility,
  ensureOneTimeTareForSession: ensureCurrentOneTimeTare,
  updateSettingsFeedback: (status, output) => updateSettingsFeedback(appElement, status, output),
  loadTrainingPrograms: async (forceRefresh) => trainingProgramsState.loadTrainingPrograms(forceRefresh),
  loadTrainingProgramPreset: (programId) => trainingProgramsState.loadTrainingProgramPreset(programId),
})

void renderCurrent()
