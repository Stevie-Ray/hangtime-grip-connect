import type { ForcePoint } from "../protocols/types.js"

type RfdAnalyzeMode = "20-80" | "100" | "150" | "200" | "250" | "300" | "1000"

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

export function renderRfdPostAnalysis(
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
