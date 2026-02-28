import { maxCurrent, meanCurrent, toFixed } from "./helpers.js"
import type { TestModule } from "./types.js"

export interface PeakForceMvcConfig {
  durationSeconds: number
  mode: "single" | "left-right"
  includeTorque: boolean
  momentArmCm: number
  includeBodyWeight: boolean
  bodyWeight: number
}

export const peakForceMvcModule: TestModule<PeakForceMvcConfig> = {
  id: "peak-force-mvc",
  defaultConfig: {
    durationSeconds: 5,
    mode: "single",
    includeTorque: false,
    momentArmCm: 35,
    includeBodyWeight: false,
    bodyWeight: 70,
  },
  renderOptions(config) {
    return `
      <div class="repeaters-options">
        <label class="repeaters-field">
          <span class="repeaters-label">Duration</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="1" step="1" data-option="durationSeconds" value="${config.durationSeconds}" />
            <span class="repeaters-unit">s</span>
          </span>
        </label>
        <label class="repeaters-field">
          <span class="repeaters-label">Mode</span>
          <select data-option="mode">
            <option value="single" ${config.mode === "single" ? "selected" : ""}>Single</option>
            <option value="left-right" ${config.mode === "left-right" ? "selected" : ""}>Left/Right</option>
          </select>
        </label>
        <label class="repeaters-field session-option-toggle">
          <input type="checkbox" data-option="includeTorque" ${config.includeTorque ? "checked" : ""} />
          <span class="repeaters-label">Include torque calculation</span>
        </label>
        <label
          class="repeaters-field session-option-dependent${config.includeTorque ? "" : " is-disabled"}"
          data-option-group="torque"
          ${config.includeTorque ? "" : "hidden"}
        >
          <span class="repeaters-label">Moment arm length</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="0.1" data-option="momentArmCm" value="${config.momentArmCm}" />
            <span class="repeaters-unit">cm</span>
          </span>
        </label>
        <label class="repeaters-field session-option-toggle">
          <input type="checkbox" data-option="includeBodyWeight" ${config.includeBodyWeight ? "checked" : ""} />
          <span class="repeaters-label">Include body-weight comparison</span>
        </label>
        <label
          class="repeaters-field session-option-dependent${config.includeBodyWeight ? "" : " is-disabled"}"
          data-option-group="body-weight"
          ${config.includeBodyWeight ? "" : "hidden"}
        >
          <span class="repeaters-label">Body weight</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0.1" step="0.1" data-option="bodyWeight" value="${config.bodyWeight}" />
            <span class="repeaters-unit">kg</span>
          </span>
        </label>
      </div>
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
    const mode =
      (root.querySelector<HTMLSelectElement>("[data-option=mode]")?.value as PeakForceMvcConfig["mode"] | undefined) ??
      current.mode
    const includeTorque =
      root.querySelector<HTMLInputElement>("[data-option=includeTorque]")?.checked ?? current.includeTorque
    const momentArmCm =
      Number.parseFloat(
        root.querySelector<HTMLInputElement>("[data-option=momentArmCm]")?.value ?? String(current.momentArmCm),
      ) || current.momentArmCm
    const includeBodyWeight =
      root.querySelector<HTMLInputElement>("[data-option=includeBodyWeight]")?.checked ?? current.includeBodyWeight
    const bodyWeight =
      Number.parseFloat(
        root.querySelector<HTMLInputElement>("[data-option=bodyWeight]")?.value ?? String(current.bodyWeight),
      ) || current.bodyWeight
    return {
      durationSeconds,
      mode,
      includeTorque,
      momentArmCm: Math.max(0, momentArmCm),
      includeBodyWeight,
      bodyWeight,
    }
  },
  renderMeasureSummary(config, lastResult) {
    const last = lastResult ? `<p><strong>Last:</strong> ${lastResult.headline}</p>` : ""
    return `<p><strong>Mode:</strong> ${config.mode}</p><p><strong>Duration:</strong> ${config.durationSeconds}s</p>${last}`
  },
  resolveDurationMs(config) {
    return config.durationSeconds * 1000
  },
  summarize(points, config) {
    const peak = maxCurrent(points)
    const mean = meanCurrent(points)
    const details = [`Peak force: ${toFixed(peak)}`, `Mean force: ${toFixed(mean)}`]
    if (config.includeTorque) {
      const torque = peak * (config.momentArmCm / 100)
      details.push(`Torque: ${toFixed(torque)} N*m`)
    }
    if (config.includeBodyWeight && config.bodyWeight > 0) {
      details.push(`Peak/Body weight: ${toFixed(peak / config.bodyWeight)}x`)
    }
    return { headline: `Peak ${toFixed(peak)}`, details }
  },
}
