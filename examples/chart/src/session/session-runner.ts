import type { Chart } from "chart.js/auto"
import type { ForceMeasurement } from "@hangtime/grip-connect"
import { getActiveDevice } from "../devices/session.js"
import { getActiveDeviceKey } from "../devices/session.js"
import { canRunActionWithDeviceKey } from "../devices/capabilities.js"
import { loadPreferences } from "../settings/storage.js"
import { getTestModule } from "../protocols/registry.js"
import { loadConfig, saveMeasurement } from "../protocols/storage.js"
import type { ForcePoint } from "../protocols/types.js"
import type { SessionResult } from "../protocols/types.js"
import { addTargetDatasets, createSessionChart, resetChartData, trimChartWindow } from "./chart-instance.js"
import { addMassHTML } from "./mass-panel.js"
import { promptSaveMeasurementInput } from "./save-measurement-dialog.js"
import {
  getEnduranceTargetZoneAtElapsedSeconds,
  getRepeatersTargetZoneAtElapsedSeconds,
  isEnduranceChartConfig,
  isRepeatersChartConfig,
} from "./protocol-zones.js"
import { renderRfdPostAnalysis } from "./rfd-analysis.js"
import { releaseWakeLock, requestWakeLock } from "../app/core/wake-lock.js"

let sessionChart: Chart | null = null
let stopActiveSession: (() => Promise<void>) | null = null

type RfdAnalyzeMode = "20-80" | "100" | "150" | "200" | "250" | "300" | "1000"

export async function teardownSessionChart(): Promise<void> {
  if (stopActiveSession) {
    await stopActiveSession()
    stopActiveSession = null
  }
  await releaseWakeLock()
  if (sessionChart) {
    sessionChart.destroy()
    sessionChart = null
  }
}

export function renderSessionChart(actionId: string): void {
  const chartElement = document.querySelector<HTMLCanvasElement>("#session-chart")
  const statusElement = document.querySelector<HTMLElement>("#session-status")
  const resultElement = document.querySelector<HTMLElement>("#session-result")
  const massesElement = document.querySelector<HTMLElement>("#masses")
  const stopButton = document.querySelector<HTMLButtonElement>("[data-stop-session]")
  const resetButton = document.querySelector<HTMLButtonElement>("[data-reset-session]")
  if (!chartElement || !statusElement || !stopButton || !resetButton || !massesElement) return

  const module = getTestModule(actionId)
  if (!module) {
    statusElement.textContent = "No test found for this action."
    stopButton.hidden = true
    stopButton.disabled = true
    resetButton.hidden = true
    resetButton.disabled = true
    return
  }
  if (!canRunActionWithDeviceKey(module.id, getActiveDeviceKey())) {
    statusElement.textContent = "This test is only available for dynamometers."
    stopButton.hidden = true
    stopButton.disabled = true
    resetButton.hidden = true
    resetButton.disabled = true
    return
  }

  const device = getActiveDevice()
  if (!device) {
    statusElement.textContent = "No connected device. Connect with Bluetooth first."
    stopButton.hidden = true
    stopButton.disabled = true
    resetButton.hidden = true
    resetButton.disabled = true
    return
  }

  stopButton.hidden = false
  stopButton.disabled = false
  resetButton.hidden = false
  resetButton.disabled = false
  stopButton.textContent = module.id === "peak-force-mvc" ? "Save Session" : "Stop Session"
  resetButton.textContent = "Reset Session"

  sessionChart?.destroy()
  sessionChart = createSessionChart(chartElement)

  const config = loadConfig(module.id, module.defaultConfig)
  const isLiveData = module.id === "live-data"
  const isPeakForceMvc = module.id === "peak-force-mvc"
  const enduranceConfig = module.id === "endurance" && isEnduranceChartConfig(config) ? config : null
  const repeatersConfig = module.id === "repeaters" && isRepeatersChartConfig(config) ? config : null
  const hasTargetLevels = Boolean(repeatersConfig?.levelsEnabled || enduranceConfig?.levelsEnabled)
  if (hasTargetLevels && sessionChart) {
    addTargetDatasets(sessionChart)
  }
  if (isPeakForceMvc && sessionChart) {
    sessionChart.data.datasets = [
      { label: "Peak", data: [], borderWidth: 2, borderColor: "#ff6384", backgroundColor: "#ff6384" },
    ]
    sessionChart.update("none")
  }

  const { unit } = loadPreferences()
  const durationMs = module.resolveDurationMs(config)
  let startedAt = Date.now()
  const points: ForcePoint[] = []
  let finished = false
  let statusTimer: ReturnType<typeof setInterval> | null = null
  let pendingResult: SessionResult | null = null

  const navigateTo = (search: string): void => {
    history.pushState({}, "", search)
    window.dispatchEvent(new PopStateEvent("popstate"))
  }

  const cancelToMenu = async (): Promise<void> => {
    finished = true
    if (statusTimer) {
      clearInterval(statusTimer)
      statusTimer = null
    }
    try {
      await device.stop?.()
    } catch {
      // Ignore stop errors during cancel.
    }
    device.notify(() => undefined)
    stopActiveSession = null
    await releaseWakeLock()
    navigateTo("?")
  }

  const resetSessionState = (): void => {
    startedAt = Date.now()
    points.length = 0
    if (resultElement) {
      resultElement.innerHTML = ""
    }
    massesElement.innerHTML = ""
    addMassHTML(
      "active",
      {
        current: 0,
        peak: 0,
        mean: 0,
        min: 0,
        unit,
        timestamp: Date.now(),
      },
      massesElement,
      0,
      { peakOnly: isPeakForceMvc },
    )

    if (!sessionChart) return
    resetChartData(sessionChart)
  }

  const saveResultWithMetadata = async (result: SessionResult): Promise<boolean> => {
    const metadata = await promptSaveMeasurementInput(module.id)
    if (!metadata) return false
    saveMeasurement(module.id, result, metadata)
    return true
  }

  const finish = async (reason: string, options?: { promptSaveAndNavigate?: boolean }): Promise<void> => {
    if (finished) return
    finished = true
    if (statusTimer) {
      clearInterval(statusTimer)
      statusTimer = null
    }
    try {
      await device.stop?.()
    } catch {
      // Ignore stop errors on teardown.
    }

    device.notify(() => undefined)
    stopActiveSession = null
    await releaseWakeLock()

    const result = module.summarize(points, config)
    pendingResult = result

    statusElement.textContent = `Session ${reason}.`
    if (module.id === "rfd" && resultElement) {
      const rfdConfig = config as { mode?: RfdAnalyzeMode; threshold?: number }
      renderRfdPostAnalysis(resultElement, points, rfdConfig.mode ?? "20-80", rfdConfig.threshold ?? 0.5)
    }

    if (options?.promptSaveAndNavigate) {
      const saved = await saveResultWithMetadata(result)
      if (saved) {
        navigateTo(`?route=${encodeURIComponent(actionId)}`)
        return
      }
    }

    if (!isLiveData) {
      stopButton.textContent = "Save Session"
      stopButton.disabled = false
      stopButton.hidden = false
      stopButton.onclick = () => {
        if (!pendingResult) return
        stopButton.disabled = true
        void (async () => {
          const saved = await saveResultWithMetadata(pendingResult)
          stopButton.disabled = false
          if (saved) {
            navigateTo(`?route=${encodeURIComponent(actionId)}`)
          }
        })()
      }

      resetButton.textContent = "Cancel"
      resetButton.disabled = false
      resetButton.hidden = false
      resetButton.onclick = () => {
        navigateTo("?")
      }
    }
  }

  stopActiveSession = () => finish("stopped")

  if (isLiveData) {
    stopButton.textContent = "Cancel Session"
    stopButton.onclick = () => {
      void cancelToMenu()
    }
    resetButton.textContent = "Reset Session"
    resetButton.onclick = () => {
      resetSessionState()
      statusElement.textContent = "Session reset."
    }
  } else if (isPeakForceMvc) {
    stopButton.textContent = "Save Session"
    stopButton.onclick = () => {
      void finish("saved", { promptSaveAndNavigate: true })
    }
    resetButton.textContent = "Cancel"
    resetButton.onclick = () => {
      void cancelToMenu()
    }
  } else {
    stopButton.textContent = "Stop Session"
    stopButton.onclick = () => {
      void finish("stopped")
    }
    resetButton.textContent = "Reset Session"
    resetButton.onclick = () => {
      resetSessionState()
      statusElement.textContent = "Session reset."
    }
  }

  resetSessionState()

  const notifyCb = (data: ForceMeasurement) => {
    const timeMs = Date.now() - startedAt
    addMassHTML("active", data, massesElement, timeMs, { peakOnly: isPeakForceMvc })
    points.push({ timeMs, current: data.current, mean: data.mean, peak: data.peak, unit: data.unit })

    const label = `${(timeMs / 1000).toFixed(1)}s`
    sessionChart?.data.labels?.push(label)
    if (isPeakForceMvc) {
      sessionChart?.data.datasets[0]?.data.push(data.peak)
    } else {
      sessionChart?.data.datasets[0]?.data.push(data.current)
      sessionChart?.data.datasets[1]?.data.push(data.mean)
      sessionChart?.data.datasets[2]?.data.push(data.peak)
    }

    if (hasTargetLevels && sessionChart) {
      const targetMinIndex = sessionChart.data.datasets.findIndex((dataset) => dataset.label === "Target min")
      const targetMaxIndex = sessionChart.data.datasets.findIndex((dataset) => dataset.label === "Target max")
      if (targetMinIndex >= 0 && targetMaxIndex >= 0) {
        const zone = repeatersConfig?.levelsEnabled
          ? getRepeatersTargetZoneAtElapsedSeconds(repeatersConfig, timeMs / 1000)
          : enduranceConfig?.levelsEnabled
            ? getEnduranceTargetZoneAtElapsedSeconds(enduranceConfig, timeMs / 1000)
            : null
        sessionChart.data.datasets[targetMinIndex]?.data.push(zone ? zone.min : null)
        sessionChart.data.datasets[targetMaxIndex]?.data.push(zone ? zone.max : null)
      }
    }

    if (sessionChart) {
      trimChartWindow(sessionChart, 200)
      sessionChart.update("none")
    }
  }

  device.notify(notifyCb, unit)

  if (typeof device.stream !== "function") {
    statusElement.textContent = ""
    stopButton.hidden = true
    stopButton.disabled = true
    resetButton.hidden = true
    resetButton.disabled = true
    void releaseWakeLock()
    return
  }

  const runSession = async (): Promise<void> => {
    await requestWakeLock()
    const countDownTime = module.getCountdownSeconds?.(config) ?? 0
    for (let left = Math.max(0, countDownTime); left >= 1; left--) {
      if (finished) return
      statusElement.textContent = `Starting in ${left}...`
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    if (finished) return

    if (module.id === "rfd") {
      try {
        try {
          await device.stop?.()
        } catch {
          // Ignore stale stream stop failures before starting a new session.
        }

        statusElement.textContent = "Pull in 3..."
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (finished) return

        statusElement.textContent = "Pull in 2..."
        startedAt = Date.now()
        const streamPromise = device.stream?.(durationMs ?? 0)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (finished) return

        statusElement.textContent = "Pull in 1..."
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (finished) return

        statusElement.textContent = "Pull now!"
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (finished) return

        statusElement.textContent = ""
        statusTimer = setInterval(() => {
          if (!module.getStatus) return
          const elapsedMs = Date.now() - startedAt
          statusElement.textContent = module.getStatus(elapsedMs, config)
        }, 100)

        await streamPromise
        if (durationMs != null) {
          await finish("completed")
        }
      } catch (error: unknown) {
        statusElement.textContent = error instanceof Error ? error.message : "Session failed."
        await finish("failed")
      }
      return
    }

    startedAt = Date.now()
    statusElement.textContent = ""
    statusTimer = setInterval(() => {
      if (!module.getStatus) return
      const elapsedMs = Date.now() - startedAt
      statusElement.textContent = module.getStatus(elapsedMs, config)
    }, 100)

    try {
      try {
        await device.stop?.()
      } catch {
        // Ignore stale stream stop failures before starting a new session.
      }
      await device.stream?.(durationMs ?? 0)
      if (durationMs != null) {
        await finish("completed")
      }
    } catch (error: unknown) {
      statusElement.textContent = error instanceof Error ? error.message : "Session failed."
      await finish("failed")
    }
  }

  void runSession()
}
