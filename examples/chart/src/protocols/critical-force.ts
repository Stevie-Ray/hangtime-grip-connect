import { maxCurrent, meanCurrent, toFixed } from "./helpers.js"
import type { ForcePoint, TestModule } from "./types.js"

export interface CriticalForceConfig {
  countDownTime: number
}

function computeCriticalForce(points: ForcePoint[]): number {
  if (points.length === 0) return 0
  const tail = points.slice(-Math.min(120, points.length))
  return meanCurrent(tail)
}

function computeWPrime(points: ForcePoint[], criticalForce: number): number {
  if (points.length < 2) return 0
  let total = 0
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const curr = points[i]
    if (!prev || !curr) continue
    const dt = Math.max(0, curr.timeMs - prev.timeMs) / 1000
    const y0 = Math.max(0, prev.current - criticalForce)
    const y1 = Math.max(0, curr.current - criticalForce)
    total += ((y0 + y1) / 2) * dt
  }
  return total
}

export const criticalForceModule: TestModule<CriticalForceConfig> = {
  id: "critical-force",
  defaultConfig: {
    countDownTime: 3,
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
      </div>
      <p class="new-session-description">Protocol uses repeated pull/rest cycles to estimate Critical Force.</p>
    `
  },
  parseOptions(root, current) {
    const legacyCountdownSeconds = (current as { countdownSeconds?: number }).countdownSeconds
    const fallbackCountDownTime = Number.isFinite(legacyCountdownSeconds)
      ? (legacyCountdownSeconds as number)
      : current.countDownTime
    const countDownTime = Math.max(
      0,
      Number.parseInt(
        root.querySelector<HTMLInputElement>("[data-option=countDownTime]")?.value ?? String(fallbackCountDownTime),
        10,
      ) || fallbackCountDownTime,
    )
    return { countDownTime }
  },
  renderMeasureSummary(_config, lastResult) {
    const last = lastResult ? `<p><strong>Last:</strong> ${lastResult.headline}</p>` : ""
    return `<p><strong>Protocol:</strong> 24 x (7s pull / 3s rest)</p>${last}`
  },
  resolveDurationMs() {
    return 240000
  },
  getCountdownSeconds(config) {
    return config.countDownTime
  },
  getStatus(elapsedMs) {
    const totalReps = 24
    const pullSeconds = 7
    const restSeconds = 3
    const cycleSeconds = pullSeconds + restSeconds
    const elapsedSeconds = Math.max(0, Math.floor(elapsedMs / 1000))
    const repIndex = Math.min(totalReps - 1, Math.floor(elapsedSeconds / cycleSeconds))
    const inCycleSeconds = elapsedSeconds % cycleSeconds
    if (inCycleSeconds < pullSeconds) {
      return `Rep ${repIndex + 1}/${totalReps} PULL (${pullSeconds - inCycleSeconds}s)`
    }
    return `Rep ${repIndex + 1}/${totalReps} REST (${cycleSeconds - inCycleSeconds}s)`
  },
  summarize(points) {
    const peak = maxCurrent(points)
    const criticalForce = computeCriticalForce(points)
    const wPrime = computeWPrime(points, criticalForce)
    return {
      headline: `CF ${toFixed(criticalForce)} | W' ${toFixed(wPrime)}`,
      details: [`Peak: ${toFixed(peak)}`, `Critical Force: ${toFixed(criticalForce)}`, `W': ${toFixed(wPrime)}`],
    }
  },
}
