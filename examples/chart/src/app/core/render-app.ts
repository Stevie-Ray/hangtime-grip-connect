import { getActiveDevice } from "../../devices/session.js"
import { setupFooter } from "../../ui/footer.js"
import { convertFontAwesome } from "../../ui/icons.js"
import { setupMenuHeader } from "../../ui/menu-header.js"
import { setupMenu } from "../../ui/menu.js"
import { setupNewSessionPage } from "../../pages/new-session.js"
import { renderSessionChart, setupSessionChartPage, teardownSessionChart } from "../../session/index.js"
import type { SettingsActionId } from "../../settings/actions.js"
import { setupSessionPage } from "../../pages/session.js"
import { setupSettingsPage } from "../../pages/settings.js"
import { setupTrainingProgramsPage } from "../../pages/training-programs.js"
import { getRouteActionId, getScreen, getSettingsPage, getTrainingProgramId } from "./router.js"
import type { AppState } from "./state.js"

interface RenderAppOptions {
  appElement: HTMLDivElement
  state: AppState
  ensureOneTimeTareForSession: () => Promise<boolean>
  executeSettingsAction: (action: SettingsActionId) => void
  syncNewSessionOptionVisibility: () => void
  loadTrainingPrograms: () => Promise<void>
}

export async function renderApp(options: RenderAppOptions): Promise<void> {
  const {
    appElement,
    state,
    ensureOneTimeTareForSession,
    executeSettingsAction,
    syncNewSessionOptionVisibility,
    loadTrainingPrograms,
  } = options

  state.isDeviceConnected = getActiveDevice() != null

  const actionId = getRouteActionId()
  const screen = getScreen()
  const settingsPage = getSettingsPage()
  const trainingProgramId = getTrainingProgramId()

  if (screen !== "chart") {
    await teardownSessionChart()
  }

  const content =
    screen === "training-programs"
      ? setupTrainingProgramsPage({
          programs: state.trainingPrograms,
          loading: state.trainingProgramsLoading,
          error: state.trainingProgramsError,
          selectedProgramId: trainingProgramId,
          loadPresetNotice: state.trainingProgramsLoadPresetNotice,
        })
      : screen === "settings"
        ? setupSettingsPage(settingsPage)
        : actionId
          ? screen === "chart"
            ? setupSessionChartPage(actionId)
            : screen === "new-session"
              ? setupNewSessionPage(actionId)
              : setupSessionPage(actionId)
          : setupMenu()

  appElement.innerHTML = `
    <div class="app-shell-card">
      ${setupMenuHeader(state.isDeviceConnected)}
      ${content}
    </div>
    ${setupFooter()}
  `

  const toggleDeviceListButton = appElement.querySelector<HTMLButtonElement>("[data-toggle-device-list]")
  if (toggleDeviceListButton) {
    toggleDeviceListButton.classList.toggle("is-connected", state.isDeviceConnected)
  }

  convertFontAwesome()

  if (screen === "new-session") {
    syncNewSessionOptionVisibility()
  }

  if (screen === "settings" && settingsPage === "system-info" && getActiveDevice()) {
    executeSettingsAction("system-info")
  }

  if (actionId && screen === "chart") {
    const device = getActiveDevice()
    if (device && !state.isDeviceTared && typeof device.tare === "function") {
      const canStart = await ensureOneTimeTareForSession()
      if (!canStart) return
    }
    renderSessionChart(actionId)
  }

  if (screen === "training-programs") {
    void loadTrainingPrograms()
  }
}
