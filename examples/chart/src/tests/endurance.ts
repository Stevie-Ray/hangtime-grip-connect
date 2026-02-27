import { maxCurrent, meanCurrent, toFixed } from "./helpers.js"
import type { TestModule } from "./types.js"

export interface EnduranceConfig {
  durationSeconds: number
  countDownTime: number
  restLevel: number
  workLevel: number
}

export const enduranceModule: TestModule<EnduranceConfig> = {
  id: "endurance",
  defaultConfig: {
    durationSeconds: 30,
    countDownTime: 3,
    restLevel: 40,
    workLevel: 80,
  },
  renderOptions(config) {
    return `
      <label>Duration (seconds)
        <input type="number" min="1" step="1" data-option="durationSeconds" value="${config.durationSeconds}" />
      </label>
      <label>Min target (%)
        <input type="number" min="0" max="100" step="1" data-option="restLevel" value="${config.restLevel}" />
      </label>
      <label>Countdown (seconds)
        <input type="number" min="0" step="1" data-option="countDownTime" value="${config.countDownTime}" />
      </label>
      <label>Max target (%)
        <input type="number" min="0" max="100" step="1" data-option="workLevel" value="${config.workLevel}" />
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
    const restLevel = Number.parseFloat(
      root.querySelector<HTMLInputElement>("[data-option=restLevel]")?.value ?? String(current.restLevel),
    )
    const countDownTime = Math.max(
      0,
      Number.parseInt(
        root.querySelector<HTMLInputElement>("[data-option=countDownTime]")?.value ?? String(current.countDownTime),
        10,
      ) || current.countDownTime,
    )
    const workLevel = Number.parseFloat(
      root.querySelector<HTMLInputElement>("[data-option=workLevel]")?.value ?? String(current.workLevel),
    )
    return {
      durationSeconds,
      countDownTime,
      restLevel: Math.max(0, Math.min(100, Number.isFinite(restLevel) ? restLevel : current.restLevel)),
      workLevel: Math.max(0, Math.min(100, Number.isFinite(workLevel) ? workLevel : current.workLevel)),
    }
  },
  renderMeasureSummary(config, lastResult) {
    const last = lastResult ? `<p><strong>Last:</strong> ${lastResult.headline}</p>` : ""
    return `<p><strong>Duration:</strong> ${config.durationSeconds}s</p><p><strong>Target:</strong> ${config.restLevel}-${config.workLevel}%</p>${last}`
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
    return `Endurance ${elapsedSeconds}s / ${config.durationSeconds}s (rem ${remaining}s)`
  },
  summarize(points) {
    const peak = maxCurrent(points)
    const mean = meanCurrent(points)
    return {
      headline: `Endurance mean ${toFixed(mean)}`,
      details: [`Peak: ${toFixed(peak)}`, `Mean: ${toFixed(mean)}`, `Samples: ${points.length}`],
    }
  },
}
