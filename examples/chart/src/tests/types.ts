export type TestId = "live-data" | "peak-force-mvc" | "endurance" | "rfd" | "repeaters" | "critical-force"

export interface ForcePoint {
  timeMs: number
  current: number
  mean: number
  peak: number
}

export interface SessionResult {
  headline: string
  details: string[]
}

export interface TestModule<TConfig> {
  id: TestId
  defaultConfig: TConfig
  renderOptions(config: TConfig): string
  parseOptions(root: ParentNode, current: TConfig): TConfig
  renderMeasureSummary(config: TConfig, lastResult: SessionResult | null): string
  resolveDurationMs(config: TConfig): number | undefined
  getCountdownSeconds?(config: TConfig): number
  getStatus?(elapsedMs: number, config: TConfig): string
  summarize(points: ForcePoint[], config: TConfig): SessionResult
}
