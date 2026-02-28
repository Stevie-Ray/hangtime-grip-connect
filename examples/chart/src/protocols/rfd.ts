import { maxCurrent, toFixed } from "./helpers.js"
import type { TestModule } from "./types.js"

export interface RfdConfig {
  durationSeconds: number
  countDownTime: number
  threshold: number
  mode: "20-80" | "100" | "150" | "200" | "250" | "300" | "1000"
  distributionMode: "single" | "bilateral"
  initialSide: "side.left" | "side.right"
  pauseBetweenSides: number
}

export const rfdModule: TestModule<RfdConfig> = {
  id: "rfd",
  defaultConfig: {
    durationSeconds: 5,
    countDownTime: 3,
    threshold: 0.5,
    mode: "20-80",
    distributionMode: "single",
    initialSide: "side.left",
    pauseBetweenSides: 10,
  },
  renderOptions(config) {
    return `
      <div class="repeaters-options">
        <label class="repeaters-field">
          <span class="repeaters-label">Countdown</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="1" data-option="countDownTime" value="${config.countDownTime}" />
            <span class="repeaters-unit">s</span>
          </span>
        </label>
        <label class="repeaters-field session-option-toggle">
          <input type="checkbox" data-option="leftRightEnabled" ${config.distributionMode === "bilateral" ? "checked" : ""} />
          <span class="repeaters-label">Enable left/right mode</span>
        </label>
        <label class="repeaters-field session-option-dependent ${config.distributionMode === "bilateral" ? "" : "is-disabled"}" data-option-group="left-right" ${config.distributionMode === "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">Start side</span>
          <select data-option="initialSide">
            <option value="side.left" ${config.initialSide === "side.left" ? "selected" : ""}>Left</option>
            <option value="side.right" ${config.initialSide === "side.right" ? "selected" : ""}>Right</option>
          </select>
        </label>
        <label class="repeaters-field session-option-dependent ${config.distributionMode === "bilateral" ? "" : "is-disabled"}" data-option-group="left-right" ${config.distributionMode === "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">Pause between sides</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="1" data-option="pauseBetweenSides" value="${config.pauseBetweenSides}" />
            <span class="repeaters-unit">s</span>
          </span>
        </label>
      </div>
    `
  },
  parseOptions(root, current) {
    const countDownTime = Math.max(
      0,
      Number.parseInt(
        root.querySelector<HTMLInputElement>("[data-option=countDownTime]")?.value ?? String(current.countDownTime),
        10,
      ) || current.countDownTime,
    )
    const leftRightEnabled =
      root.querySelector<HTMLInputElement>("[data-option=leftRightEnabled]")?.checked ??
      current.distributionMode === "bilateral"
    const initialSide =
      (root.querySelector<HTMLSelectElement>("[data-option=initialSide]")?.value as
        | RfdConfig["initialSide"]
        | undefined) ?? current.initialSide
    const pauseBetweenSides = Math.max(
      0,
      Number.parseInt(
        root.querySelector<HTMLInputElement>("[data-option=pauseBetweenSides]")?.value ??
          String(current.pauseBetweenSides),
        10,
      ) || current.pauseBetweenSides,
    )
    return {
      durationSeconds: current.durationSeconds,
      countDownTime,
      threshold: current.threshold,
      mode: current.mode,
      distributionMode: leftRightEnabled ? "bilateral" : "single",
      initialSide: initialSide === "side.right" ? "side.right" : "side.left",
      pauseBetweenSides,
    }
  },
  renderMeasureSummary(config, lastResult) {
    const last = lastResult ? `<p><strong>Last:</strong> ${lastResult.headline}</p>` : ""
    const protocolLabel = config.mode === "20-80" ? "20-80%" : `Time-interval (${config.mode}ms)`
    return `<p><strong>Protocol:</strong> ${protocolLabel}</p><p><strong>Onset threshold:</strong> ${toFixed(config.threshold)}</p><p><strong>Countdown:</strong> ${config.countDownTime}s</p><p><strong>Left/Right:</strong> ${config.distributionMode === "bilateral" ? "Enabled" : "Disabled"}</p><p><strong>Start side:</strong> ${config.initialSide === "side.right" ? "Right" : "Left"}</p><p><strong>Pause between sides:</strong> ${config.pauseBetweenSides}s</p>${last}`
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
    return `${remaining}`
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
      details: [
        `Peak: ${toFixed(peak)}`,
        `Mode: ${config.mode}`,
        `Left/Right: ${config.distributionMode === "bilateral" ? "enabled" : "disabled"}`,
        `Start side: ${config.initialSide === "side.right" ? "right" : "left"}`,
        `Pause between sides: ${config.pauseBetweenSides}s`,
        `RFD: ${toFixed(rfd)}`,
      ],
    }
  },
}
