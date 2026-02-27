import { maxCurrent, toFixed } from "./helpers.js"
import type { TestModule } from "./types.js"

export interface RfdConfig {
  durationSeconds: number
  countDownTime: number
  threshold: number
  mode: "20-80" | "100" | "150" | "200" | "250" | "300" | "1000"
}

export const rfdModule: TestModule<RfdConfig> = {
  id: "rfd",
  defaultConfig: {
    durationSeconds: 5,
    countDownTime: 3,
    threshold: 0.5,
    mode: "20-80",
  },
  renderOptions(config) {
    return `
      <label>Duration (seconds)
        <input type="number" min="1" step="1" data-option="durationSeconds" value="${config.durationSeconds}" />
      </label>
      <label>Threshold
        <input type="number" min="0" step="0.1" data-option="threshold" value="${config.threshold}" />
      </label>
      <label>Countdown (seconds)
        <input type="number" min="0" step="1" data-option="countDownTime" value="${config.countDownTime}" />
      </label>
      <label>RFD mode
        <select data-option="mode">
          ${["20-80", "100", "150", "200", "250", "300", "1000"]
            .map((value) => `<option value="${value}" ${config.mode === value ? "selected" : ""}>${value}</option>`)
            .join("")}
        </select>
      </label>
    `
  },
  parseOptions(root, current) {
    const durationSeconds = Math.max(
      1,
      Number.parseInt(
        root.querySelector<HTMLInputElement>("[data-option=durationSeconds]")?.value ?? String(current.durationSeconds),
        10,
      ) || current.durationSeconds,
    )
    const threshold =
      Number.parseFloat(
        root.querySelector<HTMLInputElement>("[data-option=threshold]")?.value ?? String(current.threshold),
      ) || current.threshold
    const countDownTime = Math.max(
      0,
      Number.parseInt(
        root.querySelector<HTMLInputElement>("[data-option=countDownTime]")?.value ?? String(current.countDownTime),
        10,
      ) || current.countDownTime,
    )
    const mode =
      (root.querySelector<HTMLSelectElement>("[data-option=mode]")?.value as RfdConfig["mode"] | undefined) ??
      current.mode
    return { durationSeconds, countDownTime, threshold: Math.max(0, threshold), mode }
  },
  renderMeasureSummary(config, lastResult) {
    const last = lastResult ? `<p><strong>Last:</strong> ${lastResult.headline}</p>` : ""
    return `<p><strong>Mode:</strong> ${config.mode}</p><p><strong>Threshold:</strong> ${toFixed(config.threshold)}</p>${last}`
  },
  resolveDurationMs(config) {
    return config.durationSeconds * 1000
  },
  getCountdownSeconds(config) {
    return config.countDownTime
  },
  getStatus(elapsedMs, config) {
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
    const remaining = Math.max(0, config.durationSeconds - elapsedSeconds)
    return `RFD ${elapsedSeconds}s / ${config.durationSeconds}s (rem ${remaining}s)`
  },
  summarize(points, config) {
    const peak = maxCurrent(points)
    const first = points.find((point) => point.current >= config.threshold)
    const t0 = first?.timeMs ?? 0
    const dt = config.mode === "20-80" ? 200 : Number(config.mode)
    const targetTime = t0 + dt
    const p0 = first?.current ?? 0
    const p1 = points.find((point) => point.timeMs >= targetTime)?.current ?? p0
    const rfd = dt > 0 ? (p1 - p0) / (dt / 1000) : 0
    return {
      headline: `RFD ${toFixed(rfd)}`,
      details: [`Peak: ${toFixed(peak)}`, `Mode: ${config.mode}`, `RFD: ${toFixed(rfd)}`],
    }
  },
}
