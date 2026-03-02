import { getActiveDevice, getActiveDeviceKey } from "../../devices/session.js"
import {
  canRunActionWithDeviceKey,
  requiresHighSamplingRate,
  MIN_DYNAMIC_TEST_SAMPLING_RATE_HZ,
} from "../../devices/capabilities.js"
import { loadPreferences } from "../../settings/storage.js"
import type { AppState } from "../core/state.js"

const SAMPLING_RATE_PROBE_DURATION_MS = 1500

function resetSamplingRateState(state: AppState): void {
  state.samplingRateDeviceKey = null
  state.samplingRateActionId = null
  state.samplingRateHz = null
  state.samplingRateChecking = false
  state.samplingRateError = null
}

export function clearSessionSamplingRateState(state: AppState): void {
  resetSamplingRateState(state)
}

export async function ensureSessionSamplingRateForAction(state: AppState, actionId: string): Promise<void> {
  if (!requiresHighSamplingRate(actionId)) return

  const deviceKey = getActiveDeviceKey()
  const device = getActiveDevice()
  if (!device || !deviceKey || !canRunActionWithDeviceKey(actionId, deviceKey)) {
    return
  }

  const hasCachedProbe =
    state.samplingRateDeviceKey === deviceKey &&
    state.samplingRateActionId === actionId &&
    (state.samplingRateHz != null || state.samplingRateError != null)
  if (hasCachedProbe || state.samplingRateChecking) {
    return
  }

  const { unit } = loadPreferences()
  state.samplingRateDeviceKey = deviceKey
  state.samplingRateActionId = actionId
  state.samplingRateHz = null
  state.samplingRateChecking = true
  state.samplingRateError = null

  let observedPeakSamplingRateHz = 0
  device.notify((data) => {
    const samplingRateHz = data.performance?.samplingRateHz
    if (typeof samplingRateHz !== "number" || !Number.isFinite(samplingRateHz)) return
    if (samplingRateHz > observedPeakSamplingRateHz) {
      observedPeakSamplingRateHz = samplingRateHz
    }
  }, unit)

  try {
    try {
      await device.stop?.()
    } catch {
      // Ignore stale stream stop failures before probe.
    }

    if (typeof device.stream !== "function") {
      return
    }

    await device.stream(SAMPLING_RATE_PROBE_DURATION_MS)
    state.samplingRateHz = observedPeakSamplingRateHz > 0 ? observedPeakSamplingRateHz : null
    if (state.samplingRateHz == null) {
      state.samplingRateError = `No sampling rate detected. This test requires at least ${MIN_DYNAMIC_TEST_SAMPLING_RATE_HZ}Hz.`
    }
  } catch (error: unknown) {
    state.samplingRateError = error instanceof Error ? error.message : "Failed to measure sampling rate."
  } finally {
    try {
      await device.stop?.()
    } catch {
      // Ignore stop errors during probe cleanup.
    }
    device.notify(() => undefined, unit)
    state.samplingRateChecking = false
  }
}
