export interface RepeatersChartConfig {
  sets: number
  reps: number
  repDur: number
  repPauseDur: number
  setPauseDur: number
  mode: "single" | "bilateral"
  initialSide: "side.left" | "side.right"
  pauseBetweenSides: number
  levelsEnabled: boolean
  leftMvc: number
  rightMvc: number
  restLevel: number
  workLevel: number
}

export interface EnduranceChartConfig {
  durationSeconds: number
  mode: "single" | "bilateral"
  initialSide: "side.left" | "side.right"
  pauseBetweenSides: number
  levelsEnabled: boolean
  leftMvc: number
  rightMvc: number
  restLevel: number
  workLevel: number
}

export function isRepeatersChartConfig(config: unknown): config is RepeatersChartConfig {
  if (typeof config !== "object" || config === null) return false
  const candidate = config as Partial<RepeatersChartConfig>
  return (
    typeof candidate.sets === "number" &&
    typeof candidate.reps === "number" &&
    typeof candidate.repDur === "number" &&
    typeof candidate.repPauseDur === "number" &&
    typeof candidate.setPauseDur === "number" &&
    (candidate.mode === "single" || candidate.mode === "bilateral")
  )
}

export function isEnduranceChartConfig(config: unknown): config is EnduranceChartConfig {
  if (typeof config !== "object" || config === null) return false
  const candidate = config as Partial<EnduranceChartConfig>
  return (
    typeof candidate.durationSeconds === "number" &&
    typeof candidate.pauseBetweenSides === "number" &&
    (candidate.mode === "single" || candidate.mode === "bilateral")
  )
}

export function computeRepeatersSingleRoundSeconds(config: RepeatersChartConfig): number {
  return config.sets * config.reps * (config.repDur + config.repPauseDur) + (config.sets - 1) * config.setPauseDur
}

function getRepeatersSideAtElapsedSeconds(
  config: RepeatersChartConfig,
  elapsedSeconds: number,
): "left" | "right" | "single" | "pause" {
  if (config.mode !== "bilateral") return "single"
  const singleRound = computeRepeatersSingleRoundSeconds(config)
  const pauseStart = singleRound
  const pauseEnd = pauseStart + config.pauseBetweenSides
  const firstSide = config.initialSide === "side.right" ? "right" : "left"
  const secondSide = firstSide === "left" ? "right" : "left"
  if (elapsedSeconds < pauseStart) return firstSide
  if (elapsedSeconds < pauseEnd) return "pause"
  return secondSide
}

export function getRepeatersTargetZoneAtElapsedSeconds(
  config: RepeatersChartConfig,
  elapsedSeconds: number,
): { min: number; max: number } | null {
  if (!config.levelsEnabled) return null
  const side = getRepeatersSideAtElapsedSeconds(config, elapsedSeconds)
  if (side === "pause") return null

  const minPercent = Math.min(config.restLevel, config.workLevel)
  const maxPercent = Math.max(config.restLevel, config.workLevel)
  const mvc =
    side === "left" ? config.leftMvc : side === "right" ? config.rightMvc : Math.max(config.leftMvc, config.rightMvc, 0)

  if (!Number.isFinite(mvc) || mvc <= 0) return null
  return {
    min: (mvc * minPercent) / 100,
    max: (mvc * maxPercent) / 100,
  }
}

function getEnduranceSideAtElapsedSeconds(
  config: EnduranceChartConfig,
  elapsedSeconds: number,
): "left" | "right" | "single" | "pause" {
  if (config.mode !== "bilateral") return "single"
  const pauseStart = config.durationSeconds
  const pauseEnd = pauseStart + config.pauseBetweenSides
  const firstSide = config.initialSide === "side.right" ? "right" : "left"
  const secondSide = firstSide === "left" ? "right" : "left"
  if (elapsedSeconds < pauseStart) return firstSide
  if (elapsedSeconds < pauseEnd) return "pause"
  return secondSide
}

export function getEnduranceTargetZoneAtElapsedSeconds(
  config: EnduranceChartConfig,
  elapsedSeconds: number,
): { min: number; max: number } | null {
  if (!config.levelsEnabled) return null
  const side = getEnduranceSideAtElapsedSeconds(config, elapsedSeconds)
  if (side === "pause") return null

  const minPercent = Math.min(config.restLevel, config.workLevel)
  const maxPercent = Math.max(config.restLevel, config.workLevel)
  const mvc =
    side === "left" ? config.leftMvc : side === "right" ? config.rightMvc : Math.max(config.leftMvc, config.rightMvc, 0)

  if (!Number.isFinite(mvc) || mvc <= 0) return null
  return {
    min: (mvc * minPercent) / 100,
    max: (mvc * maxPercent) / 100,
  }
}
