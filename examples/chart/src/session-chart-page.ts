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
    resultElement.innerHTML = `<p><strong>${result.headline}</strong></p><ul>${result.details
      .map((line) => `<li>${line}</li>`)
      .join("")}</ul>`
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
