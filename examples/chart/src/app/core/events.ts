import { connectSelectedDevice } from "../../devices/connect.js"
import { getActiveDevice, setActiveDevice } from "../../devices/session.js"
import type { SettingsActionId } from "../../settings/actions.js"
import { parseLanguage, parseUnit, savePreferences } from "../../settings/storage.js"
import { getTestModule } from "../../protocols/registry.js"
import { loadConfig, saveConfig } from "../../protocols/storage.js"
import { copyTextToClipboard } from "./clipboard.js"
import { navigate } from "./router.js"
import type { AppState } from "./state.js"

interface RegisterAppEventsOptions {
  appElement: HTMLDivElement
  state: AppState
  render: () => Promise<void>
  executeSettingsAction: (action: SettingsActionId) => void
  syncNewSessionOptionVisibility: () => void
  ensureOneTimeTareForSession: () => Promise<boolean>
  updateSettingsFeedback: (status: string, output?: string) => void
  loadTrainingPrograms: (forceRefresh?: boolean) => Promise<void>
  loadTrainingProgramPreset: (programId: string) => { ok: boolean; navigateTo?: string }
}

export function registerAppEvents(options: RegisterAppEventsOptions): void {
  const {
    appElement,
    state,
    render,
    executeSettingsAction,
    syncNewSessionOptionVisibility,
    ensureOneTimeTareForSession,
    updateSettingsFeedback,
    loadTrainingPrograms,
    loadTrainingProgramPreset,
  } = options

  const navigateAndRender = (search: string): void => {
    navigate(search, () => {
      void render()
    })
  }

  appElement.addEventListener("click", (event) => {
    const target = event.target as HTMLElement | null

    const internalLink = target?.closest<HTMLAnchorElement>('a[href^="?"]')
    if (internalLink) {
      event.preventDefault()
      const href = internalLink.getAttribute("href")
      if (href) navigateAndRender(href)
      return
    }

    const toggleDeviceListButton = target?.closest<HTMLButtonElement>("[data-toggle-device-list]")
    if (toggleDeviceListButton) {
      const deviceList = appElement.querySelector<HTMLElement>("#device-list")
      if (!deviceList) return
      const willOpen = deviceList.hasAttribute("hidden")
      if (willOpen) {
        deviceList.removeAttribute("hidden")
      } else {
        deviceList.setAttribute("hidden", "")
      }
      toggleDeviceListButton.setAttribute("aria-expanded", String(willOpen))
      return
    }

    const deviceButton = target?.closest<HTMLButtonElement>("[data-device-key]")
    if (deviceButton) {
      const deviceKey = deviceButton.dataset["deviceKey"]
      const deviceName = deviceButton.dataset["deviceName"]
      if (!deviceKey || !deviceName) return
      const statusElement = appElement.querySelector<HTMLElement>("#device-connect-status")
      void connectSelectedDevice(deviceKey, deviceName, statusElement).then((connected) => {
        if (!connected) return
        state.isDeviceConnected = true
        state.isDeviceTared = false
        const deviceList = appElement.querySelector<HTMLElement>("#device-list")
        if (deviceList) deviceList.setAttribute("hidden", "")
        const btButton = appElement.querySelector<HTMLButtonElement>("[data-toggle-device-list]")
        if (btButton) {
          btButton.classList.add("is-connected")
          btButton.setAttribute("aria-expanded", "false")
        }
        void render()
      })
      return
    }

    const disconnectDeviceButton = target?.closest<HTMLButtonElement>("[data-disconnect-device]")
    if (disconnectDeviceButton) {
      const activeDevice = getActiveDevice()
      const statusElement = appElement.querySelector<HTMLElement>("#device-connect-status")
      if (!activeDevice) {
        if (statusElement) statusElement.textContent = "No connected device."
        return
      }

      if (statusElement) statusElement.textContent = "Disconnecting..."
      void (async () => {
        try {
          await activeDevice.stop?.()
        } catch {
          // Ignore stop failures during disconnect.
        }

        try {
          await Promise.resolve(activeDevice.disconnect?.())
        } catch (error: unknown) {
          if (statusElement) {
            statusElement.textContent = error instanceof Error ? error.message : "Disconnect failed."
          }
          return
        }

        setActiveDevice(null)
        state.isDeviceConnected = false
        state.isDeviceTared = false
        await render()
      })()
      return
    }

    const openSettingsButton = target?.closest<HTMLButtonElement>("[data-open-settings]")
    if (openSettingsButton) {
      navigateAndRender("?screen=settings")
      return
    }

    const settingsActionButton = target?.closest<HTMLButtonElement>("[data-settings-action]")
    if (settingsActionButton) {
      const action = settingsActionButton.dataset["settingsAction"] as SettingsActionId | undefined
      if (!action) return
      executeSettingsAction(action)
      return
    }

    const newSessionButton = target?.closest<HTMLButtonElement>("[data-new-session-action]")
    if (newSessionButton) {
      const actionId = newSessionButton.dataset["newSessionAction"]
      if (!actionId) return
      navigateAndRender(`?route=${encodeURIComponent(actionId)}&screen=new-session`)
      return
    }

    const refreshTrainingProgramsButton = target?.closest<HTMLButtonElement>("[data-refresh-training-programs]")
    if (refreshTrainingProgramsButton) {
      void loadTrainingPrograms(true)
      return
    }

    const loadTrainingProgramButton = target?.closest<HTMLButtonElement>("[data-load-training-program]")
    if (loadTrainingProgramButton) {
      const programId = loadTrainingProgramButton.dataset["loadTrainingProgram"]
      if (!programId) return

      const result = loadTrainingProgramPreset(programId)
      if (!result.ok) {
        void render()
        return
      }

      navigateAndRender(result.navigateTo ?? "?route=repeaters&screen=new-session")
      return
    }

    const copyCliButton = target?.closest<HTMLButtonElement>("[data-copy-cli]")
    if (copyCliButton) {
      const command = copyCliButton.dataset["copyCli"]
      if (!command) return
      const icon = copyCliButton.querySelector<HTMLElement>("i")
      void (async () => {
        const copied = await copyTextToClipboard(command)
        copyCliButton.classList.toggle("is-copied", copied)
        copyCliButton.classList.toggle("is-copy-error", !copied)
        copyCliButton.setAttribute("aria-label", copied ? "CLI command copied" : "Copy failed")
        if (icon) {
          icon.classList.remove("fa-copy", "fa-check", "fa-triangle-exclamation")
          icon.classList.add(copied ? "fa-check" : "fa-triangle-exclamation")
        }
        window.setTimeout(() => {
          copyCliButton.classList.remove("is-copied", "is-copy-error")
          copyCliButton.setAttribute("aria-label", "Copy CLI command")
          if (icon) {
            icon.classList.remove("fa-check", "fa-triangle-exclamation")
            icon.classList.add("fa-copy")
          }
        }, 1500)
      })()
      return
    }

    const startSessionButton = target?.closest<HTMLButtonElement>("[data-start-session-action]")
    if (!startSessionButton) return

    const actionId = startSessionButton.dataset["startSessionAction"]
    if (!actionId) return

    void (async () => {
      if (!getActiveDevice()) {
        return
      }

      const module = getTestModule(actionId)
      if (module) {
        const form = appElement.querySelector<HTMLElement>("#session-options-form")
        const currentConfig = loadConfig(module.id, module.defaultConfig)
        const nextConfig = module.parseOptions(form ?? appElement, currentConfig)
        saveConfig(module.id, nextConfig)
      }

      const canStart = await ensureOneTimeTareForSession()
      if (!canStart) return
      navigateAndRender(`?route=${encodeURIComponent(actionId)}&screen=chart`)
    })()
  })

  appElement.addEventListener("change", (event) => {
    const target = event.target as HTMLElement | null

    const unitSelect = target?.closest<HTMLSelectElement>("[data-settings-unit]")
    if (unitSelect) {
      const unit = parseUnit(unitSelect.value)
      if (!unit) return
      savePreferences({ unit })
      updateSettingsFeedback(`Unit updated: ${unit}`)
      return
    }

    const languageSelect = target?.closest<HTMLSelectElement>("[data-settings-language]")
    if (languageSelect) {
      const language = parseLanguage(languageSelect.value)
      if (!language) return
      savePreferences({ language })
      updateSettingsFeedback(`Language updated: ${language}`)
      return
    }

    syncNewSessionOptionVisibility()
  })

  window.addEventListener("popstate", () => {
    void render()
  })
}
