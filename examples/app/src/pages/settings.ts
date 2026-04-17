import { getActiveDevice } from "../devices/session.js"
import { BAUD_RATE_OPTIONS, SAMPLING_RATE_OPTIONS } from "../settings/rates.js"
import { loadPreferences } from "../settings/storage.js"

export type SettingsPageId =
  | "unit"
  | "language"
  | "rates"
  | "sample-rate"
  | "baud-rate"
  | "system-info"
  | "calibration"
  | "errors"
  | "firmware"

function parseSettingsId(value: string | null): SettingsPageId | null {
  if (
    value === "unit" ||
    value === "language" ||
    value === "rates" ||
    value === "sample-rate" ||
    value === "baud-rate" ||
    value === "system-info" ||
    value === "calibration" ||
    value === "errors" ||
    value === "firmware"
  ) {
    return value
  }
  return null
}

interface CapabilityState {
  supportsBaudRate: boolean
  supportsTare: boolean
  supportsSampleRate: boolean
  supportsSystemInfo: boolean
  supportsCalibrationRead: boolean
  supportsCalibrationSet: boolean
  supportsCalibrationAddPoint: boolean
  supportsCalibrationSave: boolean
  supportsErrorInfo: boolean
  supportsErrorClear: boolean
  supportsFirmwareUpdate: boolean
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
    supportsBaudRate: Boolean(device?.setBaudRate),
    supportsTare: Boolean(device?.tare),
    supportsSampleRate: Boolean(device?.setSamplingRate),
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
    supportsFirmwareUpdate: Boolean(device?.dfuUpload),
  }
}

function renderSettingsList(): string {
  const capabilities = readCapabilities()
  const items = [
    { id: "unit", name: "Unit", description: "Set stream output to kilogram, pound, or newton", enabled: true },

    { id: "language", name: "Language", description: "display language", enabled: true },
    {
      id: "rates",
      name: "Rates",
      description: "Configure sample rate and baud rate on supported devices",
      enabled: capabilities.supportsSampleRate || capabilities.supportsBaudRate,
    },
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
    {
      id: "firmware",
      name: "Firmware (Beta)",
      description: "Upload a Nordic DFU .zip firmware package",
      enabled: capabilities.supportsFirmwareUpdate,
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

function renderRatesPage(): string {
  const capabilities = readCapabilities()
  const items = [
    {
      id: "sample-rate",
      name: "Sample Rate",
      description: "Set the device sampling frequency",
      enabled: capabilities.supportsSampleRate,
    },
    {
      id: "baud-rate",
      name: "Baud Rate",
      description: "Set the device UART baud rate",
      enabled: capabilities.supportsBaudRate,
    },
  ] as const

  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?screen=settings"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>Rates</h3>
      </div>
      <nav class="action-menu" aria-label="Rate settings">
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
      <p id="settings-status">${getActiveDevice() ? "Choose a device rate to configure." : "No connected device. Device-only settings are disabled."}</p>
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

function renderSampleRatePage(): string {
  const preferences = loadPreferences()
  const capabilities = readCapabilities()

  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?screen=settings&settings=rates"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>Sample Rate</h3>
      </div>
      <div class="settings-group">
        <select data-settings-sample-rate ${!capabilities.supportsSampleRate ? "disabled" : ""}>
          <option value="" ${preferences.sampleRate == null ? "selected" : ""}>Choose sample rate</option>
          ${SAMPLING_RATE_OPTIONS.map(
            (rate) =>
              `<option value="${rate}" ${preferences.sampleRate === rate ? "selected" : ""}>${rate} Hz</option>`,
          ).join("")}
        </select>
      </div>
      <p id="settings-status">${
        !getActiveDevice()
          ? "No connected device."
          : capabilities.supportsSampleRate
            ? "Choose a sample rate."
            : "Sample rate is not supported by this device."
      }</p>
    </section>
  `
}

function renderBaudRatePage(): string {
  const preferences = loadPreferences()
  const capabilities = readCapabilities()

  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?screen=settings&settings=rates"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>Baud Rate</h3>
      </div>
      <div class="settings-group">
        <select data-settings-baud-rate ${!capabilities.supportsBaudRate ? "disabled" : ""}>
          <option value="" ${preferences.baudRate == null ? "selected" : ""}>Choose baud rate</option>
          ${BAUD_RATE_OPTIONS.map(
            (rate) => `<option value="${rate}" ${preferences.baudRate === rate ? "selected" : ""}>${rate}</option>`,
          ).join("")}
        </select>
      </div>
      <p id="settings-status">${
        !getActiveDevice()
          ? "No connected device."
          : capabilities.supportsBaudRate
            ? "Choose a baud rate."
            : "Baud rate is not supported by this device."
      }</p>
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

function renderFirmwarePage(): string {
  const capabilities = readCapabilities()
  return `
    <section class="session-page" aria-label="Settings">
      <div class="page-title-row">
        <a class="session-back-link" href="?screen=settings"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>Firmware (Beta)</h3>
      </div>
      <p>Use at your own risk. Flashing the wrong Nordic DFU package can leave the device unresponsive.</p>
      <div class="settings-group">
        <label>
          Nordic DFU package (.zip)
          <input type="file" accept=".zip,application/zip" data-settings-firmware-file />
        </label>
      </div>
      <button type="button" data-settings-action="firmware-upload" ${!capabilities.supportsFirmwareUpdate ? "disabled" : ""}>Upload Firmware</button>
      <p id="settings-status">${getActiveDevice() ? "Choose a Nordic DFU package." : "No connected device."}</p>
      <pre id="settings-device-output" class="settings-output" aria-live="polite"></pre>
    </section>
  `
}

export function setupSettingsPage(rawSettingsPageId: string | null): string {
  const settingsPageId = parseSettingsId(rawSettingsPageId)
  if (!settingsPageId) return renderSettingsList()
  if (settingsPageId === "unit") return renderUnitPage()
  if (settingsPageId === "language") return renderLanguagePage()
  if (settingsPageId === "rates") return renderRatesPage()
  if (settingsPageId === "sample-rate") return renderSampleRatePage()
  if (settingsPageId === "baud-rate") return renderBaudRatePage()
  if (settingsPageId === "system-info") return renderSystemInfoPage()
  if (settingsPageId === "calibration") return renderCalibrationPage()
  if (settingsPageId === "firmware") return renderFirmwarePage()
  return renderErrorsPage()
}
