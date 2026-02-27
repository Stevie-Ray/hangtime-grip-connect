import { maxCurrent, meanCurrent, toFixed } from "./helpers.js"
import type { TestModule } from "./types.js"

export interface RepeatersConfig {
  countDownTime: number
  sets: number
  reps: number
  repDur: number
  repPauseDur: number
  setPauseDur: number
}

export const repeatersModule: TestModule<RepeatersConfig> = {
  id: "repeaters",
  defaultConfig: {
    countDownTime: 3,
    sets: 3,
    reps: 12,
    repDur: 10,
    repPauseDur: 6,
    setPauseDur: 120,
  },
  renderOptions(config) {
    return `
      <label>Countdown (s)<input type="number" min="0" step="1" data-option="countDownTime" value="${config.countDownTime}" /></label>
      <label>Sets<input type="number" min="1" step="1" data-option="sets" value="${config.sets}" /></label>
      <label>Reps<input type="number" min="1" step="1" data-option="reps" value="${config.reps}" /></label>
      <label>Work (s)<input type="number" min="1" step="1" data-option="repDur" value="${config.repDur}" /></label>
      <label>Rep rest (s)<input type="number" min="0" step="1" data-option="repPauseDur" value="${config.repPauseDur}" /></label>
      <label>Set pause (s)<input type="number" min="0" step="1" data-option="setPauseDur" value="${config.setPauseDur}" /></label>
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
    return {
      countDownTime: readInt("countDownTime", 0, current.countDownTime),
      sets: readInt("sets", 1, current.sets),
      reps: readInt("reps", 1, current.reps),
      repDur: readInt("repDur", 1, current.repDur),
      repPauseDur: readInt("repPauseDur", 0, current.repPauseDur),
      setPauseDur: readInt("setPauseDur", 0, current.setPauseDur),
    }
  },
  renderMeasureSummary(config, lastResult) {
    const totalSeconds =
      config.sets * config.reps * (config.repDur + config.repPauseDur) + (config.sets - 1) * config.setPauseDur
    const last = lastResult ? `<p><strong>Last:</strong> ${lastResult.headline}</p>` : ""
    return `<p><strong>Protocol:</strong> ${config.sets}x${config.reps}</p><p><strong>Total:</strong> ${totalSeconds}s</p>${last}`
  },
  resolveDurationMs(config) {
    const totalSeconds =
      config.sets * config.reps * (config.repDur + config.repPauseDur) + (config.sets - 1) * config.setPauseDur
    return totalSeconds * 1000
  },
  getCountdownSeconds(config) {
    return config.countDownTime
  },
  getStatus(elapsedMs, config) {
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
    let cursor = 0
    for (let set = 1; set <= config.sets; set++) {
      for (let rep = 1; rep <= config.reps; rep++) {
        const workEnd = cursor + config.repDur
        if (elapsedSeconds < workEnd) {
          return `Set ${set}/${config.sets} Rep ${rep}/${config.reps} PULL (${workEnd - elapsedSeconds}s)`
        }
        cursor = workEnd
        if (rep < config.reps) {
          const restEnd = cursor + config.repPauseDur
          if (elapsedSeconds < restEnd) {
            return `Set ${set}/${config.sets} Rep ${rep}/${config.reps} REST (${restEnd - elapsedSeconds}s)`
          }
          cursor = restEnd
        }
      }
      if (set < config.sets) {
        const pauseEnd = cursor + config.setPauseDur
        if (elapsedSeconds < pauseEnd) {
          return `Set ${set}/${config.sets} PAUSE (${pauseEnd - elapsedSeconds}s)`
        }
        cursor = pauseEnd
      }
    }
    return "Repeaters complete"
  },
  summarize(points) {
    const peak = maxCurrent(points)
    const mean = meanCurrent(points)
    return {
      headline: `Repeaters peak ${toFixed(peak)}`,
      details: [`Peak: ${toFixed(peak)}`, `Mean(work): ${toFixed(mean)}`, `Samples: ${points.length}`],
    }
  },
}
