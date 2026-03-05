import { getActiveDevice } from "../devices/session.js"
import { loadPreferences } from "../settings/storage.js"

export type SettingsPageId = "unit" | "language" | "system-info" | "calibration" | "errors"

function parseSettingsId(value: string | null): SettingsPageId | null {
  if (
    value === "unit" ||
    value === "language" ||
    value === "system-info" ||
    value === "calibration" ||
    value === "errors"
  ) {
    return value
  }
  return null
}

interface CapabilityState {
  supportsTare: boolean
  supportsSystemInfo: boolean
  supportsCalibrationRead: boolean
  supportsCalibrationSet: boolean
  supportsCalibrationAddPoint: boolean
  supportsCalibrationSave: boolean
  supportsErrorInfo: boolean
  supportsErrorClear: boolean
}

function readCapabilities(): CapabilityState {
  const device = getActiveDevice()
  const maybeDevice = device as
    | (typeof device & {
        temperature?: () => Promise<unknown> | unknown
        humidity?: () => Promise<unknown> | unknown
        manufacturer?: () => Promise<unknown> | unknown
      })
    | null
  return {
    supportsTare: Boolean(device?.tare),
    supportsSystemInfo: Boolean(
      device?.battery ||
      device?.firmware ||
      device?.calibration ||
      device?.errorInfo ||
      maybeDevice?.temperature ||
      maybeDevice?.humidity ||
      maybeDevice?.manufacturer,
    ),
    supportsCalibrationRead: Boolean(device?.calibration),
    supportsCalibrationSet: Boolean(device?.setCalibration),
    supportsCalibrationAddPoint: Boolean(device?.addCalibrationPoint),
    supportsCalibrationSave: Boolean(device?.saveCalibration),
    supportsErrorInfo: Boolean(device?.errorInfo),
    supportsErrorClear: Boolean(device?.clearErrorInfo),
  }
}

function renderSettingsList(): string {
  const capabilities = readCapabilities()
  const items = [
    { id: "unit", name: "Unit", description: "Set stream output to kilogram, pound, or newton", enabled: true },

    { id: "language", name: "Language", description: "display language", enabled: true },
    {
      id: "system-info",
      name: "System Info",
      description: "Battery, firmware, device ID, calibration, etc.",
      enabled: capabilities.supportsSystemInfo,
    },
    {
      id: "calibration",
      name: "Calibration",
      description: "Get curve, set curve, or add calibration points",
      enabled:
        capabilities.supportsCalibrationRead ||
        capabilities.supportsCalibrationSet ||
        capabilities.supportsCalibrationAddPoint,
    },
    {
      id: "errors",
      name: "Errors",
      description: "Get or clear error information",
      enabled: capabilities.supportsErrorInfo,
    },
  ] as const

  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>Settings</h3>
      </div>
      <nav class="action-menu" aria-label="Settings actions">
        <menu class="action-menu-list">
          ${items
            .map((item) => {
              if (!item.enabled) {
                return `
                  <li class="card">
                    <span class="card-content action-menu-link-disabled" aria-label="${item.name}" aria-disabled="true">
                      <strong>${item.name}</strong>
                      <small>${item.description}</small>
                    </span>
                  </li>
                `
              }
              return `
                <li class="card">
                  <a class="card-content" href="?screen=settings&settings=${item.id}" aria-label="${item.name}">
                    <strong>${item.name}</strong>
                    <small>${item.description}</small>
                  </a>
                </li>
              `
            })
            .join("")}
        </menu>
      </nav>
      <p id="settings-status">${getActiveDevice() ? "Device connected." : "No connected device. Device-only settings are disabled."}</p>
    </section>
  `
}

function renderUnitPage(): string {
  const preferences = loadPreferences()
  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?screen=settings"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>Unit</h3>
      </div>
      <div class="settings-group">
          <select data-settings-unit>
          <option value="kg" ${preferences.unit === "kg" ? "selected" : ""}>Kilogram (kg)</option>
          <option value="lbs" ${preferences.unit === "lbs" ? "selected" : ""}>Pound (lbs)</option>
          <option value="n" ${preferences.unit === "n" ? "selected" : ""}>Newton (n)</option>
        </select>
      </div>
    </section>
  `
}

function renderLanguagePage(): string {
  const preferences = loadPreferences()
  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?screen=settings"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>Language</h3>
      </div>
  <div class="settings-group">
        <select data-settings-language>
          <option value="en" ${preferences.language === "en" ? "selected" : ""}>English</option>
          <option value="es" ${preferences.language === "es" ? "selected" : ""}>Espanol</option>
          <option value="de" ${preferences.language === "de" ? "selected" : ""}>Deutsch</option>
          <option value="it" ${preferences.language === "it" ? "selected" : ""}>Italiano</option>
          <option value="no" ${preferences.language === "no" ? "selected" : ""}>Norsk</option>
          <option value="fr" ${preferences.language === "fr" ? "selected" : ""}>Francais</option>
          <option value="nl" ${preferences.language === "nl" ? "selected" : ""}>Nederlands</option>
        </select>
      </div>
    </section>
  `
}

function renderSystemInfoPage(): string {
  const capabilities = readCapabilities()
  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?screen=settings"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>System Info</h3>
      </div>
      <p id="settings-status">${getActiveDevice() ? (capabilities.supportsSystemInfo ? "Loading system info..." : "System info is not supported by this device.") : "No connected device."}</p>
      <pre id="settings-device-output" class="settings-output" aria-live="polite"></pre>
    </section>
  `
}

function renderCalibrationPage(): string {
  const capabilities = readCapabilities()
  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?screen=settings"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>Calibration</h3>
      </div>
      <button type="button" data-settings-action="calibration-read" ${!capabilities.supportsCalibrationRead ? "disabled" : ""}>Get Calibration</button>
      <label>
        Set calibration curve (12 hex bytes)
        <input type="text" placeholder="e.g. 00 00 00 00 11 22 33 44 55 66 77 88" data-settings-calibration-input />
      </label>
      <button type="button" data-settings-action="calibration-set" ${!capabilities.supportsCalibrationSet ? "disabled" : ""}>Set Calibration</button>
      <button type="button" data-settings-action="calibration-add-point" ${!capabilities.supportsCalibrationAddPoint ? "disabled" : ""}>Add Calibration Point</button>
      <button type="button" data-settings-action="calibration-save" ${!capabilities.supportsCalibrationSave ? "disabled" : ""}>Save Calibration</button>
      <p id="settings-status">${getActiveDevice() ? "Ready." : "No connected device."}</p>
      <pre id="settings-device-output" class="settings-output" aria-live="polite"></pre>
    </section>
  `
}

function renderErrorsPage(): string {
  const capabilities = readCapabilities()
  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?screen=settings"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>Errors</h3>
      </div>
      <button type="button" data-settings-action="errors-read" ${!capabilities.supportsErrorInfo ? "disabled" : ""}>Get Errors</button>
      <button type="button" data-settings-action="errors-clear" ${!capabilities.supportsErrorClear ? "disabled" : ""}>Clear Errors</button>
      <p id="settings-status">${getActiveDevice() ? "Ready." : "No connected device."}</p>
      <pre id="settings-device-output" class="settings-output" aria-live="polite"></pre>
    </section>
  `
}

export function setupSettingsPage(rawSettingsPageId: string | null): string {
  const settingsPageId = parseSettingsId(rawSettingsPageId)
  if (!settingsPageId) return renderSettingsList()
  if (settingsPageId === "unit") return renderUnitPage()
  if (settingsPageId === "language") return renderLanguagePage()
  if (settingsPageId === "system-info") return renderSystemInfoPage()
  if (settingsPageId === "calibration") return renderCalibrationPage()
  return renderErrorsPage()
}
