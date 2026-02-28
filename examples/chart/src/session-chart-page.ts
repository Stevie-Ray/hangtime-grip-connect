import { Chart } from "chart.js/auto"
import type { ForceMeasurement } from "@hangtime/grip-connect"
import { menuActions } from "./menu.js"
import { getActiveDevice } from "./device-session.js"
import { loadPreferences } from "./settings-storage.js"
import { getTestModule } from "./tests/registry.js"
import { loadConfig, saveMeasurement } from "./tests/storage.js"
import type { ForcePoint } from "./tests/types.js"

let sessionChart: Chart | null = null
let stopActiveSession: (() => Promise<void>) | null = null
const deviceMassData: Record<string, ForceMeasurement> = {}

interface RepeatersChartConfig {
  sets: number
  reps: number
  repDur: number
  repPauseDur: number
  setPauseDur: number
  mode: "single" | "bilateral"
  initialSide: "side.left" | "side.right"
  pauseBetweenSides: number
  levelsEnabled: boolean
  leftMvc: number
  rightMvc: number
  restLevel: number
  workLevel: number
}

interface EnduranceChartConfig {
  durationSeconds: number
  mode: "single" | "bilateral"
  initialSide: "side.left" | "side.right"
  pauseBetweenSides: number
  levelsEnabled: boolean
  leftMvc: number
  rightMvc: number
  restLevel: number
  workLevel: number
}

type RfdAnalyzeMode = "20-80" | "100" | "150" | "200" | "250" | "300" | "1000"

function isRepeatersChartConfig(config: unknown): config is RepeatersChartConfig {
  if (typeof config !== "object" || config === null) return false
  const candidate = config as Partial<RepeatersChartConfig>
  return (
    typeof candidate.sets === "number" &&
    typeof candidate.reps === "number" &&
    typeof candidate.repDur === "number" &&
    typeof candidate.repPauseDur === "number" &&
    typeof candidate.setPauseDur === "number" &&
    (candidate.mode === "single" || candidate.mode === "bilateral")
  )
}

function isEnduranceChartConfig(config: unknown): config is EnduranceChartConfig {
  if (typeof config !== "object" || config === null) return false
  const candidate = config as Partial<EnduranceChartConfig>
  return (
    typeof candidate.durationSeconds === "number" &&
    typeof candidate.pauseBetweenSides === "number" &&
    (candidate.mode === "single" || candidate.mode === "bilateral")
  )
}

function computeRepeatersSingleRoundSeconds(config: RepeatersChartConfig): number {
  return config.sets * config.reps * (config.repDur + config.repPauseDur) + (config.sets - 1) * config.setPauseDur
}

function getRepeatersSideAtElapsedSeconds(
  config: RepeatersChartConfig,
  elapsedSeconds: number,
): "left" | "right" | "single" | "pause" {
  if (config.mode !== "bilateral") return "single"
  const singleRound = computeRepeatersSingleRoundSeconds(config)
  const pauseStart = singleRound
  const pauseEnd = pauseStart + config.pauseBetweenSides
  const firstSide = config.initialSide === "side.right" ? "right" : "left"
  const secondSide = firstSide === "left" ? "right" : "left"
  if (elapsedSeconds < pauseStart) return firstSide
  if (elapsedSeconds < pauseEnd) return "pause"
  return secondSide
}

function getRepeatersTargetZoneAtElapsedSeconds(
  config: RepeatersChartConfig,
  elapsedSeconds: number,
): { min: number; max: number } | null {
  if (!config.levelsEnabled) return null
  const side = getRepeatersSideAtElapsedSeconds(config, elapsedSeconds)
  if (side === "pause") return null

  const minPercent = Math.min(config.restLevel, config.workLevel)
  const maxPercent = Math.max(config.restLevel, config.workLevel)
  const mvc =
    side === "left" ? config.leftMvc : side === "right" ? config.rightMvc : Math.max(config.leftMvc, config.rightMvc, 0)

  if (!Number.isFinite(mvc) || mvc <= 0) return null
  return {
    min: (mvc * minPercent) / 100,
    max: (mvc * maxPercent) / 100,
  }
}

function getEnduranceSideAtElapsedSeconds(
  config: EnduranceChartConfig,
  elapsedSeconds: number,
): "left" | "right" | "single" | "pause" {
  if (config.mode !== "bilateral") return "single"
  const pauseStart = config.durationSeconds
  const pauseEnd = pauseStart + config.pauseBetweenSides
  const firstSide = config.initialSide === "side.right" ? "right" : "left"
  const secondSide = firstSide === "left" ? "right" : "left"
  if (elapsedSeconds < pauseStart) return firstSide
  if (elapsedSeconds < pauseEnd) return "pause"
  return secondSide
}

function getEnduranceTargetZoneAtElapsedSeconds(
  config: EnduranceChartConfig,
  elapsedSeconds: number,
): { min: number; max: number } | null {
  if (!config.levelsEnabled) return null
  const side = getEnduranceSideAtElapsedSeconds(config, elapsedSeconds)
  if (side === "pause") return null

  const minPercent = Math.min(config.restLevel, config.workLevel)
  const maxPercent = Math.max(config.restLevel, config.workLevel)
  const mvc =
    side === "left" ? config.leftMvc : side === "right" ? config.rightMvc : Math.max(config.leftMvc, config.rightMvc, 0)

  if (!Number.isFinite(mvc) || mvc <= 0) return null
  return {
    min: (mvc * minPercent) / 100,
    max: (mvc * maxPercent) / 100,
  }
}

function interpolateRfd(points: ForcePoint[], targetTimeMs: number): number {
  const first = points[0]
  if (!first) return 0
  if (targetTimeMs <= first.timeMs) return first.current
  const last = points[points.length - 1]
  if (!last) return 0
  if (targetTimeMs >= last.timeMs) return last.current
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const next = points[i]
    if (!prev || !next) continue
    if (next.timeMs < targetTimeMs) continue
    const dt = next.timeMs - prev.timeMs
    if (dt <= 0) return next.current
    const ratio = (targetTimeMs - prev.timeMs) / dt
    return prev.current + (next.current - prev.current) * ratio
  }
  return last.current
}

function findRfdFirstCrossing(points: ForcePoint[], threshold: number): number {
  const first = points[0]
  if (!first) return 0
  let prev = first
  for (const current of points) {
    if (current.current >= threshold) {
      const baseTime = prev.timeMs
      const baseForce = interpolateRfd(points, baseTime)
      if (baseForce >= threshold) return baseTime
      const df = current.current - baseForce
      if (df <= 0) return current.timeMs
      const dt = current.timeMs - baseTime
      if (dt <= 0) return current.timeMs
      const ratio = (threshold - baseForce) / df
      return baseTime + dt * ratio
    }
    prev = current
  }
  return 0
}

function computeRfdFromPoints(
  points: ForcePoint[],
  mode: RfdAnalyzeMode,
  threshold: number,
): { rfd: number; peak: number } {
  const peak = points.reduce((max, point) => (point.current > max ? point.current : max), 0)
  if (points.length === 0) return { rfd: 0, peak }
  const onsetTime = findRfdFirstCrossing(points, Math.max(0, threshold))
  const onsetForce = interpolateRfd(points, onsetTime)

  if (mode === "20-80") {
    const line20 = peak * 0.2
    const line80 = peak * 0.8
    const t20 = findRfdFirstCrossing(points, line20)
    const t80 = findRfdFirstCrossing(points, line80)
    const deltaMs = Math.max(0, t80 - t20)
    const rfd = deltaMs > 0 ? (line80 - line20) / (deltaMs / 1000) : 0
    return { rfd, peak }
  }

  const windowMs = Number(mode)
  const targetTime = onsetTime + windowMs
  const targetForce = interpolateRfd(points, targetTime)
  const deltaMs = Math.max(0, targetTime - onsetTime)
  const rfd = deltaMs > 0 ? (targetForce - onsetForce) / (deltaMs / 1000) : 0
  return { rfd, peak }
}

function renderRfdPostAnalysis(
  resultElement: HTMLElement,
  points: ForcePoint[],
  initialMode: RfdAnalyzeMode,
  initialThreshold: number,
): void {
  const threshold = Number.isFinite(initialThreshold) ? initialThreshold : 0.5
  const mode = initialMode
  resultElement.innerHTML = `
    <div class="repeaters-options">
      <label class="repeaters-field">
        <span class="repeaters-label">Analysis protocol</span>
        <select data-rfd-analysis-protocol>
          <option value="20-80" ${mode === "20-80" ? "selected" : ""}>20-80%</option>
          <option value="time-window" ${mode === "20-80" ? "" : "selected"}>Time-interval</option>
        </select>
      </label>
      <label class="repeaters-field" data-rfd-time-window-group ${mode === "20-80" ? "hidden" : ""}>
        <span class="repeaters-label">Time-window</span>
        <span class="repeaters-input-with-unit">
          <select data-rfd-analysis-window>
            ${["100", "150", "200", "250", "300", "1000"]
              .map((value) => `<option value="${value}" ${mode === value ? "selected" : ""}>${value}</option>`)
              .join("")}
          </select>
          <span class="repeaters-unit">ms</span>
        </span>
      </label>
      <label class="repeaters-field">
        <span class="repeaters-label">Onset threshold</span>
        <input type="number" min="0" step="0.1" data-rfd-analysis-threshold value="${threshold}" />
      </label>
    </div>
    <div id="rfd-analysis-summary"></div>
  `

  const protocolSelect = resultElement.querySelector<HTMLSelectElement>("[data-rfd-analysis-protocol]")
  const windowGroup = resultElement.querySelector<HTMLElement>("[data-rfd-time-window-group]")
  const windowSelect = resultElement.querySelector<HTMLSelectElement>("[data-rfd-analysis-window]")
  const thresholdInput = resultElement.querySelector<HTMLInputElement>("[data-rfd-analysis-threshold]")
  const summaryElement = resultElement.querySelector<HTMLElement>("#rfd-analysis-summary")
  if (!protocolSelect || !windowGroup || !windowSelect || !thresholdInput || !summaryElement) return

  const refresh = (): void => {
    const protocol = protocolSelect.value === "time-window" ? "time-window" : "20-80"
    windowGroup.toggleAttribute("hidden", protocol !== "time-window")
    const modeValue = protocol === "time-window" ? (windowSelect.value as RfdAnalyzeMode) : "20-80"
    const thresholdValue = Number.parseFloat(thresholdInput.value)
    const { rfd, peak } = computeRfdFromPoints(
      points,
      modeValue,
      Number.isFinite(thresholdValue) ? thresholdValue : 0.5,
    )
    summaryElement.innerHTML = `<p><strong>RFD ${modeValue === "20-80" ? "20-80%" : `${modeValue}ms`}:</strong> ${rfd.toFixed(2)}</p><ul><li>Peak: ${peak.toFixed(2)}</li><li>Threshold: ${Number.isFinite(thresholdValue) ? thresholdValue.toFixed(2) : "0.50"}</li></ul>`
  }

  protocolSelect.addEventListener("change", refresh)
  windowSelect.addEventListener("change", refresh)
  thresholdInput.addEventListener("input", refresh)
  refresh()
}

function addMassHTML(
  id: string | undefined,
  data: ForceMeasurement,
  massesElement: HTMLElement | null,
  elapsedMs: number,
): void {
  if (!id || !massesElement) return
  deviceMassData[id] = data

  let deviceDiv = document.getElementById(`device-${id}`)
  if (!deviceDiv) {
    deviceDiv = document.createElement("div")
    deviceDiv.id = `device-${id}`
    deviceDiv.className = "device-mass"
    massesElement.appendChild(deviceDiv)
  } else {
    deviceDiv.innerHTML = ""
  }

  const rows: { label: string; valueText: string }[] = [
    { label: "Current", valueText: `${data.current.toFixed(2)} ${data.unit}` },
    { label: "Max", valueText: `${data.peak.toFixed(2)} ${data.unit}` },
    { label: "Average", valueText: `${data.mean.toFixed(2)} ${data.unit}` },
    { label: "Time", valueText: `${(elapsedMs / 1000).toFixed(0)} s` },
  ]

  if (data.distribution) {
    if (data.distribution.left)
      rows.push({ label: "Left", valueText: `${data.distribution.left.current.toFixed(2)} ${data.unit}` })
    if (data.distribution.center)
      rows.push({ label: "Center", valueText: `${data.distribution.center.current.toFixed(2)} ${data.unit}` })
    if (data.distribution.right)
      rows.push({ label: "Right", valueText: `${data.distribution.right.current.toFixed(2)} ${data.unit}` })
  }

  for (const { label, valueText } of rows) {
    const row = document.createElement("div")
    const labelElement = document.createElement("label")
    labelElement.textContent = label
    const strongElement = document.createElement("strong")
    strongElement.textContent = valueText
    row.appendChild(labelElement)
    row.appendChild(strongElement)
    deviceDiv.appendChild(row)
  }
}

export function setupSessionChartPage(actionId: string): string {
  const action = menuActions.find((item) => item.id === actionId)
  if (!action || action.disabled) return ""
  const backHref = action.id === "live-data" ? "?" : `?route=${action.id}&screen=new-session`

  return `
    <section class="session-page" aria-label="${action.name} chart">
      <div class="page-title-row">
        <a class="session-back-link" href="${backHref}"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>${action.name}</h3>
      </div>

      <div class="section-content">
        <p id="session-status">Preparing session...</p>
        <div class="session-controls">
          <button type="button" data-stop-session hidden disabled>Stop Session</button>
          <button type="button" data-reset-session hidden disabled>Reset Session</button>
        </div>
        <div id="masses" aria-live="polite"></div>
        <canvas id="session-chart" class="chart"></canvas>
        <div id="session-result"></div>
      </div>
    </section>
  `
}

export async function teardownSessionChart(): Promise<void> {
  if (stopActiveSession) {
    await stopActiveSession()
    stopActiveSession = null
  }
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
  if (!chartElement || !statusElement || !resultElement || !stopButton || !resetButton || !massesElement) return

  const module = getTestModule(actionId)
  if (!module) {
    statusElement.textContent = "No test found for this action."
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

  sessionChart?.destroy()
  sessionChart = new Chart(chartElement, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Current", data: [], borderWidth: 2, borderColor: "#36a2eb", backgroundColor: "#36a2eb" },
        { label: "Mean", data: [], borderWidth: 2, borderColor: "#ff9f40", backgroundColor: "#ff9f40" },
        { label: "Peak", data: [], borderWidth: 2, borderColor: "#ff6384", backgroundColor: "#ff6384" },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      elements: { point: { radius: 0 } },
      scales: { y: { beginAtZero: true } },
    },
  })

  const config = loadConfig(module.id, module.defaultConfig)
  const enduranceConfig = module.id === "endurance" && isEnduranceChartConfig(config) ? config : null
  const repeatersConfig = module.id === "repeaters" && isRepeatersChartConfig(config) ? config : null
  const hasTargetLevels = Boolean(repeatersConfig?.levelsEnabled || enduranceConfig?.levelsEnabled)
  if (hasTargetLevels) {
    sessionChart.data.datasets.push(
      {
        label: "Target min",
        data: [],
        borderWidth: 1.5,
        borderDash: [6, 6],
        borderColor: "#22c55e",
        backgroundColor: "#22c55e",
      },
      {
        label: "Target max",
        data: [],
        borderWidth: 1.5,
        borderDash: [6, 6],
        borderColor: "#f59e0b",
        backgroundColor: "#f59e0b",
      },
    )
    sessionChart.update("none")
  }
  const { unit } = loadPreferences()
  const durationMs = module.resolveDurationMs(config)
  let startedAt = Date.now()
  const points: ForcePoint[] = []
  let finished = false
  let statusTimer: ReturnType<typeof setInterval> | null = null

  const resetSessionState = (): void => {
    startedAt = Date.now()
    points.length = 0
    resultElement.innerHTML = ""
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
    )

    if (!sessionChart) return
    sessionChart.data.labels = []
    sessionChart.data.datasets.forEach((dataset) => {
      dataset.data = []
    })
    sessionChart.update("none")
  }

  const finish = async (reason: string): Promise<void> => {
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

    const result = module.summarize(points, config)
    saveMeasurement(module.id, result)

    statusElement.textContent = `Session ${reason}.`
    if (module.id === "rfd") {
      const rfdConfig = config as { mode?: RfdAnalyzeMode; threshold?: number }
      renderRfdPostAnalysis(resultElement, points, rfdConfig.mode ?? "20-80", rfdConfig.threshold ?? 0.5)
    } else {
      resultElement.innerHTML = `<p><strong>${result.headline}</strong></p><ul>${result.details
        .map((line) => `<li>${line}</li>`)
        .join("")}</ul>`
    }
  }

  stopActiveSession = () => finish("stopped")

  stopButton.onclick = () => {
    void finish("stopped")
  }

  resetButton.onclick = () => {
    resetSessionState()
    statusElement.textContent = "Session reset."
  }

  resetSessionState()

  const notifyCb = (data: ForceMeasurement) => {
    const timeMs = Date.now() - startedAt
    addMassHTML("active", data, massesElement, timeMs)
    points.push({ timeMs, current: data.current, mean: data.mean, peak: data.peak })

    const label = `${(timeMs / 1000).toFixed(1)}s`
    sessionChart?.data.labels?.push(label)
    sessionChart?.data.datasets[0]?.data.push(data.current)
    sessionChart?.data.datasets[1]?.data.push(data.mean)
    sessionChart?.data.datasets[2]?.data.push(data.peak)
    if (hasTargetLevels) {
      const targetMinIndex = sessionChart?.data.datasets.findIndex((dataset) => dataset.label === "Target min") ?? -1
      const targetMaxIndex = sessionChart?.data.datasets.findIndex((dataset) => dataset.label === "Target max") ?? -1
      if (targetMinIndex >= 0 && targetMaxIndex >= 0) {
        const zone = repeatersConfig?.levelsEnabled
          ? getRepeatersTargetZoneAtElapsedSeconds(repeatersConfig, timeMs / 1000)
          : enduranceConfig?.levelsEnabled
            ? getEnduranceTargetZoneAtElapsedSeconds(enduranceConfig, timeMs / 1000)
            : null
        sessionChart?.data.datasets[targetMinIndex]?.data.push(zone ? zone.min : null)
        sessionChart?.data.datasets[targetMaxIndex]?.data.push(zone ? zone.max : null)
      }
    }

    if ((sessionChart?.data.labels?.length ?? 0) > 200) {
      sessionChart?.data.labels?.shift()
      sessionChart?.data.datasets.forEach((dataset) => {
        dataset.data.shift()
      })
    }

    sessionChart?.update("none")
  }

  device.notify(notifyCb, unit)

  if (typeof device.stream !== "function") {
    statusElement.textContent = "Selected device does not support stream sessions."
    stopButton.hidden = true
    stopButton.disabled = true
    resetButton.hidden = true
    resetButton.disabled = true
    return
  }

  const runSession = async (): Promise<void> => {
    const countdownSeconds = module.getCountdownSeconds?.(config) ?? 0
    for (let left = Math.max(0, countdownSeconds); left >= 1; left--) {
      if (finished) return
      statusElement.textContent = `Starting in ${left}...`
      await new Promise((resolve) => setTimeout(resolve, 1000))
    }
    if (finished) return

    if (module.id === "rfd") {
      try {
        statusElement.textContent = "Pull in 3..."
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (finished) return

        statusElement.textContent = "Pull in 2..."
        startedAt = Date.now()
        const streamPromise = device.stream?.(durationMs)
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (finished) return

        statusElement.textContent = "Pull in 1..."
        await new Promise((resolve) => setTimeout(resolve, 1000))
        if (finished) return

        statusElement.textContent = "PULL"
        await new Promise((resolve) => setTimeout(resolve, 700))
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
      await device.stream?.(durationMs)
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
