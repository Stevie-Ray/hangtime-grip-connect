import "./style.css"
import type { ForceUnit } from "@hangtime/grip-connect"
import { connectSelectedDevice } from "./device-connect.js"
import { getActiveDevice } from "./device-session.js"
import { setupFooter } from "./footer.js"
import { convertFontAwesome, setupFontAwesome } from "./icons.js"
import { setupMenuHeader } from "./menu-header.js"
import { setupMenu } from "./menu.js"
import { setupNewSessionPage } from "./new-session-page.js"
import { renderSessionChart, setupSessionChartPage, teardownSessionChart } from "./session-chart-page.js"
import { loadPreferences, savePreferences } from "./settings-storage.js"
import { setupSessionPage } from "./session-page.js"
import { setupSettingsPage } from "./settings-page.js"
import { setupTrainingProgramsPage } from "./training-programs-page.js"
import {
  fetchTrainingPrograms,
  hasTrainingProgramsEnv,
  pickTrainingProgramId,
  type TrainingProgramRecord,
} from "./training-programs.js"
import { getTestModule } from "./tests/registry.js"
import { loadConfig, saveConfig } from "./tests/storage.js"

const appElement = document.querySelector<HTMLDivElement>("#app")
let isDeviceConnected = false
let isDeviceTared = false
let trainingPrograms: TrainingProgramRecord[] | null = null
let trainingProgramsLoading = false
let trainingProgramsError: string | null = null
let trainingProgramsLoadPresetNotice: string | null = null

setupFontAwesome()

function getRouteActionId(): string | null {
  const route = new URLSearchParams(window.location.search).get("route")
  return route && /^[a-z0-9-]+$/.test(route) ? route : null
}

function getScreen(): string | null {
  return new URLSearchParams(window.location.search).get("screen")
}

function getSettingsPage(): string | null {
  return new URLSearchParams(window.location.search).get("settings")
}

function getTrainingProgramId(): string | null {
  return new URLSearchParams(window.location.search).get("trainingProgram")
}

function navigate(search: string): void {
  history.pushState({}, "", search)
  void render()
}

function parseUnit(value: string): ForceUnit | null {
  if (value === "kg" || value === "lbs" || value === "n") return value
  return null
}

function parseLanguage(value: string): "en" | "es" | "de" | "it" | "no" | "fr" | "nl" | null {
  if (
    value === "en" ||
    value === "es" ||
    value === "de" ||
    value === "it" ||
    value === "no" ||
    value === "fr" ||
    value === "nl"
  ) {
    return value
  }
  return null
}

function parseCalibrationCurveInput(raw: string): Uint8Array | null {
  const trimmed = raw.trim()
  if (!trimmed) return new Uint8Array(0)
  const tokens = trimmed.split(/[\s,]+/).filter((token) => token.length > 0)
  if (tokens.length !== 12) return null
  const bytes = tokens.map((token) => {
    const parsed = Number.parseInt(token.replace(/^0x/i, ""), 16)
    return Number.isFinite(parsed) && parsed >= 0 && parsed <= 255 ? parsed : NaN
  })
  if (bytes.some((value) => Number.isNaN(value))) return null
  return new Uint8Array(bytes)
}

async function copyTextToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text)
      return true
    }
  } catch {
    // Fall through to legacy copy path.
  }

  const textarea = document.createElement("textarea")
  textarea.value = text
  textarea.setAttribute("readonly", "")
  textarea.style.position = "fixed"
  textarea.style.opacity = "0"
  textarea.style.pointerEvents = "none"
  document.body.appendChild(textarea)
  textarea.focus()
  textarea.select()

  try {
    return document.execCommand("copy")
  } catch {
    return false
  } finally {
    textarea.remove()
  }
}

function updateSettingsFeedback(status: string, output?: string): void {
  if (!appElement) return
  const statusElement = appElement.querySelector<HTMLElement>("#settings-status")
  const outputElement = appElement.querySelector<HTMLElement>("#settings-device-output")
  if (statusElement) statusElement.textContent = status
  if (outputElement && output != null) outputElement.textContent = output
}

function syncNewSessionOptionVisibility(): void {
  if (!appElement) return
  const form = appElement.querySelector<HTMLElement>("#session-options-form")
  if (!form) return

  const includeTorque = form.querySelector<HTMLInputElement>("[data-option=includeTorque]")?.checked
  const torqueGroup = form.querySelector<HTMLElement>("[data-option-group=torque]")
  const torqueInput = form.querySelector<HTMLInputElement>("[data-option=momentArmCm]")
  if (torqueGroup && torqueInput && includeTorque != null) {
    torqueGroup.toggleAttribute("hidden", !includeTorque)
    torqueGroup.classList.toggle("is-disabled", !includeTorque)
    torqueInput.disabled = !includeTorque
  }

  const includeBodyWeight = form.querySelector<HTMLInputElement>("[data-option=includeBodyWeight]")?.checked
  const bodyWeightGroup = form.querySelector<HTMLElement>("[data-option-group=body-weight]")
  const bodyWeightInput = form.querySelector<HTMLInputElement>("[data-option=bodyWeight]")
  if (bodyWeightGroup && bodyWeightInput && includeBodyWeight != null) {
    bodyWeightGroup.toggleAttribute("hidden", !includeBodyWeight)
    bodyWeightGroup.classList.toggle("is-disabled", !includeBodyWeight)
    bodyWeightInput.disabled = !includeBodyWeight
  }
}

function usesHardwareTare(device: NonNullable<ReturnType<typeof getActiveDevice>>): boolean {
  return "usesHardwareTare" in device && (device as { usesHardwareTare?: boolean }).usesHardwareTare === true
}

async function runFallbackTarePrompt(device: NonNullable<ReturnType<typeof getActiveDevice>>): Promise<boolean> {
  const confirmed = window.confirm(
    "One-time tare calibration is required before starting.\n\nKeep the device unloaded and still, then press OK to tare.",
  )
  if (!confirmed) return false

  const started = device.tare?.(1000)
  if (!started) return false
  if (!usesHardwareTare(device)) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return true
}

async function runGuidedTareDialog(): Promise<boolean> {
  const device = getActiveDevice()
  if (!device || typeof device.tare !== "function") return true

  const supportsDialog =
    typeof HTMLDialogElement !== "undefined" && typeof document.createElement("dialog").showModal === "function"
  if (!supportsDialog) {
    return runFallbackTarePrompt(device)
  }

  const dialog = document.createElement("dialog")
  dialog.className = "tare-dialog"
  dialog.innerHTML = `
    <form method="dialog" class="tare-dialog-form">
      <h3>Tare Required</h3>
      <p>One-time tare calibration is required before starting a session.</p>
      <p>Keep the device unloaded and still. Session start is blocked until tare completes.</p>
      <p class="tare-dialog-current">Current: <strong data-tare-current>0.0</strong> <span data-tare-unit>kg</span></p>
      <p class="tare-dialog-status" data-tare-status aria-live="polite">Preparing...</p>
      <menu class="tare-dialog-actions">
        <button type="button" value="confirm" data-tare-confirm>Tare and Start</button>
      </menu>
    </form>
  `
  document.body.appendChild(dialog)

  const currentElement = dialog.querySelector<HTMLElement>("[data-tare-current]")
  const statusElement = dialog.querySelector<HTMLElement>("[data-tare-status]")
  const unitElement = dialog.querySelector<HTMLElement>("[data-tare-unit]")
  const confirmButton = dialog.querySelector<HTMLButtonElement>("[data-tare-confirm]")
  const { unit } = loadPreferences()
  if (unitElement) unitElement.textContent = unit

  let done = false
  const closeDialog = (ok: boolean): void => {
    if (done) return
    done = true
    dialog.close(ok ? "confirm" : "cancel")
  }

  const streamFn = device.stream
  if (typeof streamFn === "function") {
    try {
      await streamFn(0)
      if (statusElement) statusElement.textContent = "Live stream active."
    } catch (error: unknown) {
      if (statusElement) {
        statusElement.textContent = error instanceof Error ? error.message : "Failed to start stream for tare."
      }
    }
  } else if (statusElement) {
    statusElement.textContent = "Device stream is unavailable. Running tare directly."
  }

  device.notify((data) => {
    if (!currentElement) return
    const current = Number.isFinite(data.current) ? data.current : 0
    currentElement.textContent = current.toFixed(1)
  }, unit)

  if (confirmButton) {
    confirmButton.onclick = async () => {
      if (done) return
      confirmButton.disabled = true
      if (statusElement) statusElement.textContent = "Running tare..."

      try {
        const started = device.tare?.(1000)
        if (!started) {
          throw new Error("Tare could not be started.")
        }
        if (!usesHardwareTare(device)) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
        if (statusElement) statusElement.textContent = "Tare complete."
        closeDialog(true)
      } catch (error: unknown) {
        if (statusElement) {
          statusElement.textContent = error instanceof Error ? error.message : "Tare failed."
        }
        confirmButton.disabled = false
      }
    }
  }

  dialog.addEventListener("cancel", (event) => {
    // Non-closable flow: require tare before session start.
    event.preventDefault()
  })

  dialog.showModal()

  const result = await new Promise<boolean>((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        resolve(dialog.returnValue === "confirm")
      },
      { once: true },
    )
  })

  try {
    await device.stop?.()
  } catch {
    // Ignore stop errors during tare dialog cleanup.
  }
  device.notify(() => undefined, unit)
  dialog.remove()

  return result
}

async function ensureOneTimeTareForSession(): Promise<boolean> {
  const device = getActiveDevice()
  if (!device) return false
  if (isDeviceTared) return true
  if (typeof device.tare !== "function") return true

  const tared = await runGuidedTareDialog()
  if (tared) {
    isDeviceTared = true
  }
  return tared
}

type SettingsActionId =
  | "tare"
  | "system-info"
  | "calibration-read"
  | "calibration-set"
  | "calibration-add-point"
  | "calibration-save"
  | "errors-read"
  | "errors-clear"

async function runSettingsAction(action: SettingsActionId): Promise<void> {
  if (!appElement) return
  const device = getActiveDevice()
  if (!device) {
    updateSettingsFeedback("No connected device.")
    return
  }

  try {
    if (action === "tare") {
      if (!device.tare) {
        updateSettingsFeedback("Tare is not supported by this device.")
        return
      }
      const started = device.tare(1000)
      updateSettingsFeedback(started ? "Tare started." : "Tare did not start.")
      if (started) {
        isDeviceTared = true
      }
      return
    }

    if (action === "system-info") {
      const lines: string[] = []
      if (device.battery) lines.push(`Battery: ${(await device.battery()) ?? "Unavailable"}`)
      if (device.firmware) lines.push(`Firmware: ${(await device.firmware()) ?? "Unavailable"}`)
      if (lines.length === 0) {
        updateSettingsFeedback("System Info is not supported by this device.")
        return
      }
      updateSettingsFeedback("System info loaded.", lines.join("\n"))
      return
    }

    if (action === "calibration-read") {
      if (!device.calibration) {
        updateSettingsFeedback("Calibration is not supported by this device.")
        return
      }
      const calibration = await device.calibration()
      updateSettingsFeedback(
        "Calibration loaded.",
        calibration == null ? "No calibration payload returned." : String(calibration),
      )
      return
    }

    if (action === "calibration-set") {
      if (!device.setCalibration) {
        updateSettingsFeedback("Setting calibration is not supported by this device.")
        return
      }
      const input = appElement.querySelector<HTMLInputElement>("[data-settings-calibration-input]")
      const curve = parseCalibrationCurveInput(input?.value ?? "")
      if (!curve) {
        updateSettingsFeedback("Invalid curve. Provide 12 hex bytes separated by spaces or commas.")
        return
      }
      await device.setCalibration(curve)
      updateSettingsFeedback(curve.length === 0 ? "Calibration reset." : "Calibration curve updated.")
      return
    }

    if (action === "calibration-add-point") {
      if (!device.addCalibrationPoint) {
        updateSettingsFeedback("Add calibration point is not supported by this device.")
        return
      }
      await device.addCalibrationPoint()
      updateSettingsFeedback("Calibration point captured.")
      return
    }

    if (action === "calibration-save") {
      if (!device.saveCalibration) {
        updateSettingsFeedback("Save calibration is not supported by this device.")
        return
      }
      await device.saveCalibration()
      updateSettingsFeedback("Calibration saved.")
      return
    }

    if (action === "errors-read") {
      if (!device.errorInfo) {
        updateSettingsFeedback("Error info is not supported by this device.")
        return
      }
      const info = await device.errorInfo()
      updateSettingsFeedback("Error info loaded.", info ?? "No error details returned.")
      return
    }

    if (action === "errors-clear") {
      if (!device.clearErrorInfo) {
        updateSettingsFeedback("Clear errors is not supported by this device.")
        return
      }
      await device.clearErrorInfo()
      updateSettingsFeedback("Errors cleared.")
    }
  } catch (error: unknown) {
    updateSettingsFeedback(error instanceof Error ? error.message : "Settings action failed.")
  }
}

async function loadTrainingPrograms(forceRefresh = false): Promise<void> {
  if (!hasTrainingProgramsEnv()) return
  if (trainingProgramsLoading) return
  if (trainingPrograms != null && !forceRefresh) return

  trainingProgramsLoading = true
  trainingProgramsError = null
  if (forceRefresh) {
    trainingProgramsLoadPresetNotice = null
  }
  void render()

  try {
    trainingPrograms = await fetchTrainingPrograms(forceRefresh)
  } catch (error: unknown) {
    trainingProgramsError = error instanceof Error ? error.message : "Failed to load training programs."
  } finally {
    trainingProgramsLoading = false
  }

  void render()
}

function parseRepeatersPreset(preset: unknown): {
  countDownTime: number
  sets: number
  reps: number
  repDur: number
  repPauseDur: number
  setPauseDur: number
} | null {
  if (typeof preset !== "object" || preset === null) return null
  const raw = preset as Record<string, unknown>

  const parseIntMin = (value: unknown, min: number, fallback: number): number => {
    const n = typeof value === "number" ? value : Number(value)
    if (!Number.isFinite(n)) return fallback
    return Math.max(min, Math.trunc(n))
  }

  return {
    countDownTime: parseIntMin(raw["countDownTime"], 0, 3),
    sets: parseIntMin(raw["sets"], 1, 3),
    reps: parseIntMin(raw["reps"], 1, 12),
    repDur: parseIntMin(raw["repDur"], 1, 10),
    repPauseDur: parseIntMin(raw["repPauseDur"], 0, 6),
    setPauseDur: parseIntMin(raw["setPauseDur"], 0, 8 * 60),
  }
}

function findTrainingProgramById(programId: string): TrainingProgramRecord | null {
  if (!trainingPrograms) return null
  const entry = trainingPrograms
    .map((program, index) => ({ program, id: pickTrainingProgramId(program, index) }))
    .find((item) => item.id === programId)
  return entry?.program ?? null
}

async function render(): Promise<void> {
  if (!appElement) return

  isDeviceConnected = getActiveDevice() != null
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
          programs: trainingPrograms,
          loading: trainingProgramsLoading,
          error: trainingProgramsError,
          selectedProgramId: trainingProgramId,
          loadPresetNotice: trainingProgramsLoadPresetNotice,
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
      ${setupMenuHeader()}
      ${content}
    </div>
    ${setupFooter()}
  `
  const toggleDeviceListButton = appElement.querySelector<HTMLButtonElement>("[data-toggle-device-list]")
  if (toggleDeviceListButton) {
    toggleDeviceListButton.classList.toggle("is-connected", isDeviceConnected)
  }
  convertFontAwesome()
  if (screen === "new-session") {
    syncNewSessionOptionVisibility()
  }
  if (actionId && screen === "chart") {
    const device = getActiveDevice()
    if (device && !isDeviceTared && typeof device.tare === "function") {
      const canStart = await ensureOneTimeTareForSession()
      if (!canStart) return
    }
    renderSessionChart(actionId)
  }

  if (screen === "training-programs") {
    void loadTrainingPrograms()
  }
}

appElement?.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null

  const internalLink = target?.closest<HTMLAnchorElement>('a[href^="?"]')
  if (internalLink) {
    event.preventDefault()
    const href = internalLink.getAttribute("href")
    if (href) navigate(href)
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
      isDeviceConnected = true
      isDeviceTared = false
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

  const openSettingsButton = target?.closest<HTMLButtonElement>("[data-open-settings]")
  if (openSettingsButton) {
    navigate("?screen=settings")
    return
  }

  const settingsActionButton = target?.closest<HTMLButtonElement>("[data-settings-action]")
  if (settingsActionButton) {
    const action = settingsActionButton.dataset["settingsAction"] as SettingsActionId | undefined
    if (!action) return
    void runSettingsAction(action)
    return
  }

  const newSessionButton = target?.closest<HTMLButtonElement>("[data-new-session-action]")
  if (newSessionButton) {
    const actionId = newSessionButton.dataset["newSessionAction"]
    if (!actionId) return
    navigate(`?route=${encodeURIComponent(actionId)}&screen=new-session`)
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

    const program = findTrainingProgramById(programId)
    if (!program) {
      trainingProgramsLoadPresetNotice = "Training program not found."
      void render()
      return
    }

    const preset = parseRepeatersPreset(program["repeatersPreset"])
    if (!preset) {
      trainingProgramsLoadPresetNotice = "No repeaters preset found for this training program."
      void render()
      return
    }

    saveConfig("repeaters", preset)
    trainingProgramsLoadPresetNotice = null
    navigate("?route=repeaters&screen=new-session")
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
      window.alert("No connected device. Connect with Bluetooth first.")
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
    navigate(`?route=${encodeURIComponent(actionId)}&screen=chart`)
  })()
})

appElement?.addEventListener("change", (event) => {
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

void render()
