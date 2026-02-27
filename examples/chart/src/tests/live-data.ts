import { maxCurrent, meanCurrent, toFixed } from "./helpers.js"
import type { TestModule } from "./types.js"

export interface LiveDataConfig {
  durationSeconds: number
}

export const liveDataModule: TestModule<LiveDataConfig> = {
  id: "live-data",
  defaultConfig: {
    durationSeconds: 0,
  },
  renderOptions(config) {
    return `
      <label>
        Duration (seconds, 0 = continuous)
        <input type="number" min="0" step="1" data-option="durationSeconds" value="${config.durationSeconds}" />
      </label>
    `
  },
  parseOptions(root, current) {
    const durationInput = root.querySelector<HTMLInputElement>("[data-option=durationSeconds]")
    const durationSeconds = Math.max(
      0,
      Number.parseInt(durationInput?.value ?? String(current.durationSeconds), 10) || 0,
    )
    return { durationSeconds }
  },
  renderMeasureSummary(config, lastResult) {
    const durationLabel = config.durationSeconds > 0 ? `${config.durationSeconds}s` : "Continuous"
    const last = lastResult ? `<p><strong>Last:</strong> ${lastResult.headline}</p>` : ""
    return `<p><strong>Duration:</strong> ${durationLabel}</p>${last}`
  },
  resolveDurationMs(config) {
    if (config.durationSeconds <= 0) return undefined
    return config.durationSeconds * 1000
  },
  summarize(points) {
    const peak = maxCurrent(points)
    const mean = meanCurrent(points)
    return {
      headline: `Peak ${toFixed(peak)} | Mean ${toFixed(mean)}`,
      details: [`Samples: ${points.length}`, `Peak: ${toFixed(peak)}`, `Mean: ${toFixed(mean)}`],
    }
  },
}
