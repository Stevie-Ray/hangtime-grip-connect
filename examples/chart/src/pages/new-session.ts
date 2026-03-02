import { menuActions } from "../ui/menu.js"
import { getActiveDevice } from "../devices/session.js"
import { getActiveDeviceKey } from "../devices/session.js"
import {
  canRunActionWithDeviceKey,
  MIN_DYNAMIC_TEST_SAMPLING_RATE_HZ,
  requiresHighSamplingRate,
} from "../devices/capabilities.js"
import { getTestModule } from "../protocols/registry.js"
import { loadConfig } from "../protocols/storage.js"

interface NewSessionSamplingRateState {
  hz: number | null
  checking: boolean
  error: string | null
}

function renderDescription(details: string): string {
  const normalized = details.replaceAll("\\n\\n", "\n\n").replaceAll("\\n", "\n")
  return normalized
    .split(/\n{2,}/)
    .map((paragraph) => paragraph.trim())
    .filter((paragraph) => paragraph.length > 0)
    .map((paragraph) => `<p class="new-session-description">${paragraph.replaceAll("\n", "<br>")}</p>`)
    .join("")
}

export function setupNewSessionPage(actionId: string, samplingRateState?: NewSessionSamplingRateState): string {
  const action = menuActions.find((item) => item.id === actionId)
  if (!action || action.disabled) return ""
  const module = getTestModule(actionId)
  const details = action.description || action.short_description
  const options = module ? module.renderOptions(loadConfig(module.id, module.defaultConfig)) : ""
  const isConnected = getActiveDevice() != null
  const isSupportedByDevice = canRunActionWithDeviceKey(action.id, getActiveDeviceKey())
  const samplingRateRequired = requiresHighSamplingRate(action.id)
  const samplingRateHz = samplingRateState?.hz ?? null
  const samplingRateChecking = samplingRateState?.checking ?? false
  const hasSufficientSamplingRate =
    !samplingRateRequired || (samplingRateHz != null && samplingRateHz >= MIN_DYNAMIC_TEST_SAMPLING_RATE_HZ)
  const canStart = isConnected && isSupportedByDevice && hasSufficientSamplingRate && !samplingRateChecking

  return `
    <section class="session-page" aria-label="${action.name} options">
      <div class="page-title-row">
        <a class="session-back-link" href="?route=${action.id}"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>${action.name}</h3>
      </div>

      <div class="section-content">
        ${renderDescription(details)}
        <form id="session-options-form">
          ${options}
        </form>
      </div>

      <button type="button" class="start-session-button" data-start-session-action="${action.id}" ${canStart ? "" : "disabled"}>Start Session</button>
      ${
        isConnected
          ? isSupportedByDevice
            ? samplingRateRequired
              ? samplingRateChecking
                ? "<p>Checking device sampling rate...</p>"
                : hasSufficientSamplingRate
                  ? ""
                  : `<p>This test is only available for dynamometers above ${MIN_DYNAMIC_TEST_SAMPLING_RATE_HZ}Hz.${samplingRateHz != null ? ` (Detected: ${samplingRateHz.toFixed(0)}Hz)` : ""}</p>${samplingRateState?.error ? `<p>${samplingRateState.error}</p>` : ""}`
              : ""
            : "<p>This test is only available for dynamometers.</p>"
          : "<p>No connected device. Connect with Bluetooth first.</p>"
      }
  
    </section>
  `
}
