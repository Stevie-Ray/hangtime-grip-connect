import { maxCurrent, meanCurrent, toFixed } from "./helpers.js"
import type { ForcePoint, TestModule } from "./types.js"

export interface RepeatersConfig {
  countDownTime: number
  sets: number
  reps: number
  repDur: number
  repPauseDur: number
  setPauseDur: number
  mode: "unilateral" | "bilateral"
  initialSide: "side.left" | "side.right"
  pauseBetweenSides: number
  levelsEnabled: boolean
  mvc: number
  leftMvc: number
  rightMvc: number
  restLevel: number
  workLevel: number
}

function computeSingleRoundSeconds(config: RepeatersConfig): number {
  return config.sets * config.reps * (config.repDur + config.repPauseDur) + (config.sets - 1) * config.setPauseDur
}

function computeTotalSeconds(config: RepeatersConfig): number {
  const singleRound = computeSingleRoundSeconds(config)
  if (config.mode !== "bilateral") return singleRound
  return singleRound * 2 + config.pauseBetweenSides
}

function getSideAtElapsedSeconds(
  config: RepeatersConfig,
  elapsedSeconds: number,
): "left" | "right" | "unilateral" | "pause" {
  if (config.mode !== "bilateral") return "unilateral"
  const singleRound = computeSingleRoundSeconds(config)
  const pauseStart = singleRound
  const pauseEnd = pauseStart + config.pauseBetweenSides
  const firstSide = config.initialSide === "side.right" ? "right" : "left"
  const secondSide = firstSide === "left" ? "right" : "left"
  if (elapsedSeconds < pauseStart) return firstSide
  if (elapsedSeconds < pauseEnd) return "pause"
  return secondSide
}

function getZoneRange(
  config: RepeatersConfig,
  side: "left" | "right" | "unilateral",
): { min: number; max: number } | null {
  if (!config.levelsEnabled) return null
  const mvc =
    side === "left"
      ? config.leftMvc
      : side === "right"
        ? config.rightMvc
        : Math.max(config.mvc, config.leftMvc, config.rightMvc)
  if (!Number.isFinite(mvc) || mvc <= 0) return null
  const minPercent = Math.min(config.restLevel, config.workLevel)
  const maxPercent = Math.max(config.restLevel, config.workLevel)
  return {
    min: (mvc * minPercent) / 100,
    max: (mvc * maxPercent) / 100,
  }
}

function summarizeSide(points: ForcePoint[]): { peak: number; mean: number } {
  return {
    peak: maxCurrent(points),
    mean: meanCurrent(points),
  }
}

export const repeatersModule: TestModule<RepeatersConfig> = {
  id: "repeaters",
  defaultConfig: {
    countDownTime: 3,
    sets: 1,
    reps: 5,
    repDur: 10,
    repPauseDur: 10,
    setPauseDur: 120,
    mode: "unilateral",
    initialSide: "side.left",
    pauseBetweenSides: 10,
    levelsEnabled: false,
    mvc: 0,
    leftMvc: 0,
    rightMvc: 0,
    restLevel: 40,
    workLevel: 80,
  },
  renderOptions(config) {
    const minTarget = Math.min(config.restLevel, config.workLevel)
    const maxTarget = Math.max(config.restLevel, config.workLevel)
    const singleMvc = Math.max(config.mvc, config.leftMvc, config.rightMvc)
    return `
      <div class="repeaters-options">
        <label class="repeaters-field">
          <span class="repeaters-label">Sets</span>
          <input type="number" min="1" step="1" data-option="sets" value="${config.sets}" />
        </label>
        <div class="repeaters-set-wrapper">
          <div class="repeaters-set-title">Set</div>
          <label class="repeaters-field">
            <span class="repeaters-label">Reps</span>
            <input type="number" min="1" step="1" data-option="reps" value="${config.reps}" />
          </label>
          <label class="repeaters-field">
            <span class="repeaters-label">Work</span>
            <span class="repeaters-input-with-unit">
              <input type="number" min="1" step="1" data-option="repDur" value="${config.repDur}" />
              <span class="repeaters-unit">s</span>
            </span>
          </label>
          <label class="repeaters-field">
            <span class="repeaters-label">Rest</span>
            <span class="repeaters-input-with-unit">
              <input type="number" min="0" step="1" data-option="repPauseDur" value="${config.repPauseDur}" />
              <span class="repeaters-unit">s</span>
            </span>
          </label>
        </div>
        <label class="repeaters-field">
          <span class="repeaters-label">Pause</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="1" data-option="setPauseDur" value="${config.setPauseDur}" />
            <span class="repeaters-unit">s</span>
          </span>
        </label>
        <hr/>
        <label class="repeaters-field">
          <span class="repeaters-label">Countdown before start</span>
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
          <span class="repeaters-label">Pause between sides (s)</span>
          <span class="repeaters-input-with-unit">
            <input type="number" min="0" step="1" data-option="pauseBetweenSides" value="${config.pauseBetweenSides}" />
            <span class="repeaters-unit">s</span>
          </span>
        </label>
        <label class="repeaters-field session-option-toggle">
          <input type="checkbox" data-option="levelsEnabled" ${config.levelsEnabled ? "checked" : ""} />
          <span class="repeaters-label">Plot target levels</span>
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled && config.mode !== "bilateral" ? "" : "is-disabled"}" data-option-group="target-levels-single" ${config.levelsEnabled && config.mode !== "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">MVC (kg)</span>
          <input type="number" min="0" step="0.1" data-option="mvc" value="${singleMvc}" />
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled && config.mode === "bilateral" ? "" : "is-disabled"}" data-option-group="target-levels-bilateral" ${config.levelsEnabled && config.mode === "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">Left MVC (kg)</span>
          <input type="number" min="0" step="0.1" data-option="leftMvc" value="${config.leftMvc}" />
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled && config.mode === "bilateral" ? "" : "is-disabled"}" data-option-group="target-levels-bilateral" ${config.levelsEnabled && config.mode === "bilateral" ? "" : "hidden"}>
          <span class="repeaters-label">Right MVC (kg)</span>
          <input type="number" min="0" step="0.1" data-option="rightMvc" value="${config.rightMvc}" />
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled ? "" : "is-disabled"}" data-option-group="target-levels" ${config.levelsEnabled ? "" : "hidden"}>
          <span class="repeaters-label">Min target (%)</span>
          <input type="number" min="0" max="100" step="1" data-option="restLevel" value="${minTarget}" />
        </label>
        <label class="repeaters-field session-option-dependent ${config.levelsEnabled ? "" : "is-disabled"}" data-option-group="target-levels" ${config.levelsEnabled ? "" : "hidden"}>
          <span class="repeaters-label">Max target (%)</span>
          <input type="number" min="0" max="100" step="1" data-option="workLevel" value="${maxTarget}" />
        </label>
      </div>
    `
  },
  parseOptions(root, current) {
    const readInt = (key: string, min: number, fallback: number): number => {
      const n = Number.parseInt(
        root.querySelector<HTMLInputElement>(`[data-option=${key}]`)?.value ?? String(fallback),
        10,
      )
      return Math.max(min, Number.isFinite(n) ? n : fallback)
    }
    const readFloat = (key: string, min: number, fallback: number): number => {
      const n = Number.parseFloat(
        root.querySelector<HTMLInputElement>(`[data-option=${key}]`)?.value ?? String(fallback),
      )
      return Math.max(min, Number.isFinite(n) ? n : fallback)
    }
    const normalizePercent = (value: number): number => Math.max(0, Math.min(100, value))
    const leftRightEnabled =
      root.querySelector<HTMLInputElement>("[data-option=leftRightEnabled]")?.checked ?? current.mode === "bilateral"
    const mode: RepeatersConfig["mode"] = leftRightEnabled ? "bilateral" : "unilateral"
    const initialSide =
      (root.querySelector<HTMLSelectElement>("[data-option=initialSide]")?.value as
        | RepeatersConfig["initialSide"]
        | undefined) ?? current.initialSide
    const levelsEnabled =
      root.querySelector<HTMLInputElement>("[data-option=levelsEnabled]")?.checked ?? current.levelsEnabled
    const mvc = readFloat("mvc", 0, Math.max(current.mvc, current.leftMvc, current.rightMvc))
    const leftMvc = readFloat("leftMvc", 0, current.leftMvc)
    const rightMvc = readFloat("rightMvc", 0, current.rightMvc)
    const rawRest = normalizePercent(readInt("restLevel", 0, current.restLevel))
    const rawWork = normalizePercent(readInt("workLevel", 0, current.workLevel))
    const restLevel = Math.min(rawRest, rawWork)
    const workLevel = Math.max(rawRest, rawWork)
    return {
      countDownTime: readInt("countDownTime", 0, current.countDownTime),
      sets: readInt("sets", 1, current.sets),
      reps: readInt("reps", 1, current.reps),
      repDur: readInt("repDur", 1, current.repDur),
      repPauseDur: readInt("repPauseDur", 0, current.repPauseDur),
      setPauseDur: readInt("setPauseDur", 0, current.setPauseDur),
      mode: mode === "bilateral" ? "bilateral" : "unilateral",
      initialSide: initialSide === "side.right" ? "side.right" : "side.left",
      pauseBetweenSides: readInt("pauseBetweenSides", 0, current.pauseBetweenSides),
      levelsEnabled,
      mvc: mode === "bilateral" ? Math.max(leftMvc, rightMvc, mvc) : mvc,
      leftMvc: mode === "bilateral" ? leftMvc : mvc,
      rightMvc: mode === "bilateral" ? rightMvc : mvc,
      restLevel,
      workLevel,
    }
  },
  renderMeasureSummary(config, lastResult) {
    const totalSeconds = computeTotalSeconds(config)
    const last = lastResult ? `<p><strong>Last:</strong> ${lastResult.headline}</p>` : ""
    const modeLabel = config.mode === "bilateral" ? "Left/Right" : "Single"
    const levelsLabel = config.levelsEnabled ? `${config.restLevel}-${config.workLevel}%` : "Off"
    return `<p><strong>Protocol:</strong> ${config.sets}x${config.reps}</p><p><strong>Mode:</strong> ${modeLabel}</p><p><strong>Target levels:</strong> ${levelsLabel}</p><p><strong>Total:</strong> ${totalSeconds}s</p>${last}`
  },
  resolveDurationMs(config) {
    const totalSeconds = computeTotalSeconds(config)
    return totalSeconds * 1000
  },
  getCountdownSeconds(config) {
    return config.countDownTime
  },
  getStatus(elapsedMs, config) {
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
    const singleRoundSeconds = computeSingleRoundSeconds(config)
    const side = getSideAtElapsedSeconds(config, elapsedSeconds)
    if (side === "pause") {
      const pauseLeft = Math.max(0, singleRoundSeconds + config.pauseBetweenSides - elapsedSeconds)
      return `Side switch pause (${pauseLeft}s)`
    }

    const roundElapsedSeconds =
      config.mode === "bilateral" && elapsedSeconds > singleRoundSeconds + config.pauseBetweenSides
        ? elapsedSeconds - singleRoundSeconds - config.pauseBetweenSides
        : elapsedSeconds

    let cursor = 0
    for (let set = 1; set <= config.sets; set++) {
      for (let rep = 1; rep <= config.reps; rep++) {
        const workEnd = cursor + config.repDur
        if (roundElapsedSeconds < workEnd) {
          const sideLabel = side === "left" ? " Left" : side === "right" ? " Right" : ""
          return `Set ${set}/${config.sets} Rep ${rep}/${config.reps}${sideLabel} PULL (${workEnd - roundElapsedSeconds}s)`
        }
        cursor = workEnd
        if (rep < config.reps) {
          const restEnd = cursor + config.repPauseDur
          if (roundElapsedSeconds < restEnd) {
            const sideLabel = side === "left" ? " Left" : side === "right" ? " Right" : ""
            return `Set ${set}/${config.sets} Rep ${rep}/${config.reps}${sideLabel} REST (${restEnd - roundElapsedSeconds}s)`
          }
          cursor = restEnd
        }
      }
      if (set < config.sets) {
        const pauseEnd = cursor + config.setPauseDur
        if (roundElapsedSeconds < pauseEnd) {
          return `Set ${set}/${config.sets} PAUSE (${pauseEnd - roundElapsedSeconds}s)`
        }
        cursor = pauseEnd
      }
    }
    return "Repeaters complete"
  },
  summarize(points, config) {
    const peak = maxCurrent(points)
    const mean = meanCurrent(points)
    const details = [`Peak: ${toFixed(peak)}`, `Mean(work): ${toFixed(mean)}`, `Samples: ${points.length}`]

    if (config.mode === "bilateral") {
      const singleRoundMs = computeSingleRoundSeconds(config) * 1000
      const pauseMs = config.pauseBetweenSides * 1000
      const firstSide = config.initialSide === "side.right" ? "Right" : "Left"
      const secondSide = firstSide === "Left" ? "Right" : "Left"
      const firstPoints = points.filter((point) => point.timeMs <= singleRoundMs)
      const secondPoints = points.filter((point) => point.timeMs > singleRoundMs + pauseMs)
      const firstStats = summarizeSide(firstPoints)
      const secondStats = summarizeSide(secondPoints)
      details.push(`${firstSide} peak: ${toFixed(firstStats.peak)}`, `${secondSide} peak: ${toFixed(secondStats.peak)}`)
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
      headline: `Repeaters peak ${toFixed(peak)}`,
      details,
    }
  },
}
