import { maxCurrent, meanCurrent, toFixed } from "./helpers.js"
import type { TestModule } from "./types.js"

export interface EnduranceConfig {
  durationSeconds: number
  countDownTime: number
  mode: "unilateral" | "bilateral"
  initialSide: "side.left" | "side.right"
  pauseBetweenSides: number
  levelsEnabled: boolean
  leftMvc: number
  rightMvc: number
  restLevel: number
  workLevel: number
}

function computeTotalDurationSeconds(config: EnduranceConfig): number {
  if (config.mode !== "bilateral") return config.durationSeconds
  return config.durationSeconds * 2 + config.pauseBetweenSides
}

function getEnduranceSideAtElapsedSeconds(
  config: EnduranceConfig,
  elapsedSeconds: number,
): "left" | "right" | "unilateral" | "pause" {
  if (config.mode !== "bilateral") return "unilateral"
  const pauseStart = config.durationSeconds
  const pauseEnd = pauseStart + config.pauseBetweenSides
  const firstSide = config.initialSide === "side.right" ? "right" : "left"
  const secondSide = firstSide === "left" ? "right" : "left"
  if (elapsedSeconds < pauseStart) return firstSide
  if (elapsedSeconds < pauseEnd) return "pause"
  return secondSide
}

function getZoneRange(
  config: EnduranceConfig,
  side: "left" | "right" | "unilateral",
): { min: number; max: number } | null {
  if (!config.levelsEnabled) return null
  const mvc =
    side === "left" ? config.leftMvc : side === "right" ? config.rightMvc : Math.max(config.leftMvc, config.rightMvc)
  if (!Number.isFinite(mvc) || mvc <= 0) return null
  const minPercent = Math.min(config.restLevel, config.workLevel)
  const maxPercent = Math.max(config.restLevel, config.workLevel)
  return {
    min: (mvc * minPercent) / 100,
    max: (mvc * maxPercent) / 100,
  }
}

export const enduranceModule: TestModule<EnduranceConfig> = {
  id: "endurance",
  defaultConfig: {
    durationSeconds: 30,
    countDownTime: 3,
    mode: "unilateral",
    initialSide: "side.left",
    pauseBetweenSides: 10,
    levelsEnabled: false,
    leftMvc: 0,
    rightMvc: 0,
    restLevel: 40,
    workLevel: 80,
  },
  renderOptions(config) {
    const singleMvc = Math.max(config.leftMvc, config.rightMvc)
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
          <span class="repeaters-label">Countdown</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="1" data-option="countDownTime" value="${config.countDownTime}" />
            <span class="repeaters-unit">s</span>
          </span>
        </label>

        <label class="repeaters-field session-option-toggle">
          <input type="checkbox" data-option="leftRightEnabled" ${config.mode === "bilateral" ? "checked" : ""} />
          <span class="repeaters-label">Enable left/right mode</span>
        </label>
        <label class="repeaters-field session-option-dependent ${config.mode === "bilateral" ? "" : "is-disabled"}" data-option-group="left-right" ${config.mode === "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">Start side</span>
          <select data-option="initialSide">
            <option value="side.left" ${config.initialSide === "side.left" ? "selected" : ""}>Left</option>
            <option value="side.right" ${config.initialSide === "side.right" ? "selected" : ""}>Right</option>
          </select>
        </label>
        <label class="repeaters-field session-option-dependent ${config.mode === "bilateral" ? "" : "is-disabled"}" data-option-group="left-right" ${config.mode === "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">Pause between sides</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="1" data-option="pauseBetweenSides" value="${config.pauseBetweenSides}" />
            <span class="repeaters-unit">s</span>
          </span>
        </label>

        <label class="repeaters-field session-option-toggle">
          <input type="checkbox" data-option="levelsEnabled" ${config.levelsEnabled ? "checked" : ""} />
          <span class="repeaters-label">Plot target zone</span>
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled && config.mode !== "bilateral" ? "" : "is-disabled"}" data-option-group="target-levels-single" ${config.levelsEnabled && config.mode !== "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">MVC</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="0.1" data-option="mvc" value="${singleMvc}" />
            <span class="repeaters-unit">kg</span>
          </span>
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled && config.mode === "bilateral" ? "" : "is-disabled"}" data-option-group="target-levels-bilateral" ${config.levelsEnabled && config.mode === "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">Left MVC</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="0.1" data-option="leftMvc" value="${config.leftMvc}" />
            <span class="repeaters-unit">kg</span>
          </span>
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled && config.mode === "bilateral" ? "" : "is-disabled"}" data-option-group="target-levels-bilateral" ${config.levelsEnabled && config.mode === "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">Right MVC</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="0.1" data-option="rightMvc" value="${config.rightMvc}" />
            <span class="repeaters-unit">kg</span>
          </span>
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled ? "" : "is-disabled"}" data-option-group="target-levels" ${config.levelsEnabled ? "" : "hidden"}>
          <span class="repeaters-label">Min target</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" max="100" step="1" data-option="restLevel" value="${Math.min(config.restLevel, config.workLevel)}" />
            <span class="repeaters-unit">%</span>
          </span>
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled ? "" : "is-disabled"}" data-option-group="target-levels" ${config.levelsEnabled ? "" : "hidden"}>
          <span class="repeaters-label">Max target</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" max="100" step="1" data-option="workLevel" value="${Math.max(config.restLevel, config.workLevel)}" />
            <span class="repeaters-unit">%</span>
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
    const countDownTime = Math.max(
      0,
      Number.parseInt(
        root.querySelector<HTMLInputElement>("[data-option=countDownTime]")?.value ?? String(current.countDownTime),
        10,
      ) || current.countDownTime,
    )
    const leftRightEnabled =
      root.querySelector<HTMLInputElement>("[data-option=leftRightEnabled]")?.checked ?? current.mode === "bilateral"
    const mode: EnduranceConfig["mode"] = leftRightEnabled ? "bilateral" : "unilateral"
    const initialSide =
      (root.querySelector<HTMLSelectElement>("[data-option=initialSide]")?.value as
        | EnduranceConfig["initialSide"]
        | undefined) ?? current.initialSide
    const pauseBetweenSides = Math.max(
      0,
      Number.parseInt(
        root.querySelector<HTMLInputElement>("[data-option=pauseBetweenSides]")?.value ??
          String(current.pauseBetweenSides),
        10,
      ) || current.pauseBetweenSides,
    )
    const levelsEnabled =
      root.querySelector<HTMLInputElement>("[data-option=levelsEnabled]")?.checked ?? current.levelsEnabled
    const mvc =
      Number.parseFloat(root.querySelector<HTMLInputElement>("[data-option=mvc]")?.value ?? "") ||
      Math.max(current.leftMvc, current.rightMvc)
    const leftMvcInput =
      Number.parseFloat(
        root.querySelector<HTMLInputElement>("[data-option=leftMvc]")?.value ?? String(current.leftMvc),
      ) || current.leftMvc
    const rightMvcInput =
      Number.parseFloat(
        root.querySelector<HTMLInputElement>("[data-option=rightMvc]")?.value ?? String(current.rightMvc),
      ) || current.rightMvc
    const leftMvc = mode === "bilateral" ? leftMvcInput : mvc
    const rightMvc = mode === "bilateral" ? rightMvcInput : mvc
    const rawRest = Number.parseFloat(
      root.querySelector<HTMLInputElement>("[data-option=restLevel]")?.value ?? String(current.restLevel),
    )
    const rawWork = Number.parseFloat(
      root.querySelector<HTMLInputElement>("[data-option=workLevel]")?.value ?? String(current.workLevel),
    )
    const restLevel = Math.max(0, Math.min(100, Number.isFinite(rawRest) ? rawRest : current.restLevel))
    const workLevel = Math.max(0, Math.min(100, Number.isFinite(rawWork) ? rawWork : current.workLevel))
    return {
      durationSeconds,
      countDownTime,
      mode,
      initialSide: initialSide === "side.right" ? "side.right" : "side.left",
      pauseBetweenSides,
      levelsEnabled,
      leftMvc: Math.max(0, leftMvc),
      rightMvc: Math.max(0, rightMvc),
      restLevel: Math.min(restLevel, workLevel),
      workLevel: Math.max(restLevel, workLevel),
    }
  },
  renderMeasureSummary(config, lastResult) {
    const totalDuration = computeTotalDurationSeconds(config)
    const last = lastResult ? `<p><strong>Last:</strong> ${lastResult.headline}</p>` : ""
    const modeLabel = config.mode === "bilateral" ? "Left/Right" : "Single"
    const targetLabel = config.levelsEnabled ? `${config.restLevel}-${config.workLevel}%` : "Off"
    return `<p><strong>Duration:</strong> ${config.durationSeconds}s</p><p><strong>Total:</strong> ${totalDuration}s</p><p><strong>Mode:</strong> ${modeLabel}</p><p><strong>Target zone:</strong> ${targetLabel}</p>${last}`
  },
  resolveDurationMs(config) {
    return computeTotalDurationSeconds(config) * 1000
  },
  getCountdownSeconds(config) {
    return config.countDownTime
  },
  getStatus(elapsedMs, config) {
    const totalDuration = computeTotalDurationSeconds(config)
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
    const side = getEnduranceSideAtElapsedSeconds(config, elapsedSeconds)
    if (side === "pause") {
      const pauseLeft = Math.max(0, config.durationSeconds + config.pauseBetweenSides - elapsedSeconds)
      return `Side switch pause (${pauseLeft}s)`
    }
    const sideLabel = side === "left" ? " Left" : side === "right" ? " Right" : ""
    const remaining = Math.max(0, totalDuration - elapsedSeconds)
    return `${sideLabel} ${remaining}`
  },
  summarize(points, config) {
    const peak = maxCurrent(points)
    const mean = meanCurrent(points)
    const details = [`Peak: ${toFixed(peak)}`, `Mean: ${toFixed(mean)}`, `Samples: ${points.length}`]
    if (config.mode === "bilateral") {
      const firstSide = config.initialSide === "side.right" ? "Right" : "Left"
      const secondSide = firstSide === "Left" ? "Right" : "Left"
      const firstEndMs = config.durationSeconds * 1000
      const secondStartMs = firstEndMs + config.pauseBetweenSides * 1000
      const firstPoints = points.filter((point) => point.timeMs <= firstEndMs)
      const secondPoints = points.filter((point) => point.timeMs > secondStartMs)
      details.push(
        `${firstSide} mean: ${toFixed(meanCurrent(firstPoints))}`,
        `${secondSide} mean: ${toFixed(meanCurrent(secondPoints))}`,
      )
    }
    if (config.levelsEnabled) {
      const leftZone = getZoneRange(config, "left")
      const rightZone = getZoneRange(config, "right")
      if (leftZone && rightZone) {
        details.push(
          `Target Left: ${toFixed(leftZone.min)}-${toFixed(leftZone.max)} kg`,
          `Target Right: ${toFixed(rightZone.min)}-${toFixed(rightZone.max)} kg`,
        )
      }
    }
    return {
      headline: `Endurance mean ${toFixed(mean)}`,
      details,
    }
  },
}
