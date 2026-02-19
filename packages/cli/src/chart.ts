import process from "node:process"
import { plot, blue, red, yellow, reset } from "asciichart"
import pc from "picocolors"

/** Number of samples to keep in the rolling buffer. */
const DEFAULT_BUFFER_SIZE = 80
/** Height of the ASCII chart in lines. */
const DEFAULT_HEIGHT = 10

/** Options for configuring the live chart renderer. */
export interface ChartRendererOptions {
  /** Number of data points to display (default: 80). */
  bufferSize?: number
  /** Chart height in terminal lines (default: 10). */
  height?: number
  /** If true, chart output is suppressed (useful for non-TTY or quiet mode). */
  disabled?: boolean
  /** Unit label for the force values (e.g. "kg", "lb"). */
  unit?: string
  /** Dim status line output when true (default). */
  dimStatus?: boolean
}

/** Data point pushed to the chart: current, mean, and peak force values. */
export interface ChartDataPoint {
  current: number
  mean: number
  peak: number
}

/** A force sample used to render post-run RFD analysis charts. */
export interface RfdChartPoint {
  /** Milliseconds elapsed since the start of the capture window. */
  timeMs: number
  /** Force value in stream unit. */
  force: number
}

/** Options for rendering a static post-run RFD chart. */
export interface RfdAnalyzeChartOptions {
  /** Captured force samples over the analysis window. */
  points: RfdChartPoint[]
  /** Maximum force in the window. */
  maxForce: number
  /** 20% line value; ignored when show2080=false. */
  line20?: number
  /** 80% line value; ignored when show2080=false. */
  line80?: number
  /** Render 20/80 overlays when true. */
  show2080?: boolean
  /** Chart height in rows. */
  height?: number
  /** Max horizontal points shown in terminal. */
  width?: number
}

/** Options for rendering a static Critical Force session chart. */
export interface CriticalForceChartOptions {
  /** Full-session force samples. */
  points: RfdChartPoint[]
  /** Critical Force line value. */
  criticalForce: number
  /** Maximum force in the session. */
  maxForce: number
  /** Chart height in rows. */
  height?: number
  /** Max horizontal points shown in terminal. */
  width?: number
}

function interpolateForce(points: RfdChartPoint[], targetTimeMs: number): number {
  const first = points[0]
  if (!first) return 0
  if (targetTimeMs <= first.timeMs) return first.force
  const last = points[points.length - 1]
  if (!last) return 0
  if (targetTimeMs >= last.timeMs) return last.force

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]
    const next = points[i]
    if (!prev || !next) continue
    if (next.timeMs < targetTimeMs) continue
    const span = next.timeMs - prev.timeMs
    if (span <= 0) return next.force
    const ratio = (targetTimeMs - prev.timeMs) / span
    return prev.force + (next.force - prev.force) * ratio
  }

  return last.force
}

function resamplePoints(points: RfdChartPoint[], width: number): number[] {
  if (points.length === 0 || width <= 0) return []
  if (points.length <= width) return points.map((p) => p.force)

  const first = points[0]
  const last = points[points.length - 1]
  if (!first || !last) return []
  const start = first.timeMs
  const end = last.timeMs
  const span = Math.max(1, end - start)
  const out: number[] = new Array(width)
  for (let i = 0; i < width; i++) {
    const t = start + (span * i) / Math.max(1, width - 1)
    out[i] = interpolateForce(points, t)
  }
  return out
}

/**
 * Renders a static ASCII chart for post-run RFD analysis.
 * Includes the force curve and optional 20/80 overlays.
 */
export function renderRfdAnalyzeChart(options: RfdAnalyzeChartOptions): string {
  const { points, maxForce, line20, line80, show2080 = true, height = 14, width = 90 } = options
  const forceSeries = resamplePoints(points, width)
  if (forceSeries.length === 0) return ""

  const safeMax = Math.max(1, maxForce)
  const series: number[][] = []
  const colors: string[] = []

  if (show2080) {
    series.push(new Array(forceSeries.length).fill(Math.max(0, line20 ?? 0)))
    series.push(new Array(forceSeries.length).fill(Math.max(0, line80 ?? 0)))
    colors.push(blue, red)
  }
  // Render force last so reference overlays don't hide the curve.
  series.push(forceSeries)
  colors.push(yellow)

  return plot(series, {
    height,
    min: 0,
    max: safeMax,
    colors,
  })
}

/**
 * Renders the full Critical Force session with a horizontal CF reference line.
 */
export function renderCriticalForceChart(options: CriticalForceChartOptions): string {
  const { points, criticalForce, maxForce, height = 14, width = 90 } = options
  const forceSeries = resamplePoints(points, width)
  if (forceSeries.length === 0) return ""

  const safeMax = Math.max(1, maxForce, criticalForce)
  const cfLine = new Array(forceSeries.length).fill(Math.max(0, criticalForce))

  return plot([forceSeries, cfLine], {
    height,
    min: 0,
    max: safeMax,
    colors: [yellow, red],
  })
}

/**
 * Creates a live ASCII chart renderer for streaming force data.
 * Uses a ring buffer and renders to stdout when push() is called.
 * Call start() before pushing data and stop() when done to clear the chart.
 *
 * @param options - Chart configuration; all fields are optional
 * @returns Object with push, start, and stop methods
 */
export function createChartRenderer(options: ChartRendererOptions = {}) {
  const {
    bufferSize = DEFAULT_BUFFER_SIZE,
    height = DEFAULT_HEIGHT,
    disabled = false,
    unit = "kg",
    dimStatus = true,
  } = options

  // Ring buffers for current, mean, and peak (oldest at logical index 0)
  const currentBuf = new Array<number>(bufferSize).fill(0)
  const meanBuf = new Array<number>(bufferSize).fill(0)
  const peakBuf = new Array<number>(bufferSize).fill(0)
  // Reusable linearized buffers — filled each frame, passed via slice(0, count) to plot
  const currentLinear = new Array<number>(bufferSize)
  const meanLinear = new Array<number>(bufferSize)
  const peakLinear = new Array<number>(bufferSize)
  let head = 0 // next write index
  let count = 0 // how many samples we have so far

  let renderScheduled = false
  let started = false
  let isTTY = false // cached at start() for hot path
  let stoppedToken = 0 // incremented on stop() so pending nextTick skips render
  let lastLines = 0 // for clearing the previous frame on next render

  let lastCurrent = 0
  let lastMean = 0
  let lastPeak = 0
  let statusLine = ""

  const clamp0 = (v: number) => (v > 0 ? v : 0)

  // Batches rapid push() calls into a single render per tick
  function scheduleRender(): void {
    if (renderScheduled) return
    renderScheduled = true
    const token = stoppedToken
    process.nextTick(() => {
      renderScheduled = false
      if (token !== stoppedToken) return
      render()
    })
  }

  function push(data: ChartDataPoint): void {
    if (disabled || !started || !isTTY) return

    const c = clamp0(data.current)
    const m = clamp0(data.mean)
    const p = clamp0(data.peak)

    currentBuf[head] = c
    meanBuf[head] = m
    peakBuf[head] = p

    head++
    if (head >= bufferSize) head = 0
    if (count < bufferSize) count++

    lastCurrent = c
    lastMean = m
    lastPeak = p

    scheduleRender()
  }

  // Linearizes all three ring buffers into reusable arrays and returns max value.
  // Single pass; rolling index avoids % in the hot loop.
  function linearizeAndGetMax(): number {
    let idx = head - count
    if (idx < 0) idx += bufferSize
    let maxY = 1
    for (let i = 0; i < count; i++) {
      const c = currentBuf[idx] ?? 0
      const m = meanBuf[idx] ?? 0
      const p = peakBuf[idx] ?? 0
      currentLinear[i] = c
      meanLinear[i] = m
      peakLinear[i] = p
      if (c > maxY) maxY = c
      if (m > maxY) maxY = m
      if (p > maxY) maxY = p
      idx++
      if (idx >= bufferSize) idx = 0
    }
    return maxY
  }

  function countNewlines(s: string): number {
    let n = 0
    for (let i = 0; i < s.length; i++) if (s.charCodeAt(i) === 10) n++
    return n
  }

  // Move cursor up and clear from cursor to end of screen (ANSI escape codes)
  function clearPrevious(lines: number): void {
    if (lines <= 0) return
    process.stdout.write(`\r\x1b[${lines}A\x1b[J`)
  }

  function render(): void {
    if (disabled || !started || !isTTY || count === 0) return

    const maxY = linearizeAndGetMax()

    // slice(0, count) allocates 3 small arrays per frame — negligible vs plot()
    const chartStr = plot([currentLinear.slice(0, count), meanLinear.slice(0, count), peakLinear.slice(0, count)], {
      height,
      min: 0,
      max: maxY, // avoids asciichart’s own min/max scan
      colors: [blue, yellow, red],
    })

    const statsLine =
      blue +
      `Current: ${lastCurrent.toFixed(2)} ${unit}` +
      `  ` +
      red +
      `Max: ${lastPeak.toFixed(2)} ${unit}` +
      `  ` +
      yellow +
      `Avg: ${lastMean.toFixed(2)} ${unit}` +
      reset

    // Track line count so we can overwrite the previous frame cleanly
    const nl = countNewlines(chartStr)
    const chartLineCount = nl + (chartStr.endsWith("\n") ? 0 : 1)
    const totalLines = chartLineCount + 1 + (statusLine ? 1 : 0) // + stats line (+ optional status)

    if (lastLines > 0) clearPrevious(lastLines)
    lastLines = totalLines

    process.stdout.write(chartStr)
    if (!chartStr.endsWith("\n")) process.stdout.write("\n")
    process.stdout.write(statsLine + "\n")
    if (statusLine) process.stdout.write((dimStatus ? pc.dim(statusLine) : statusLine) + "\n")
  }

  function start(): void {
    if (disabled || started) return
    isTTY = !!process.stdout.isTTY
    if (!isTTY) return
    started = true
    lastLines = 0
  }

  function stop(): void {
    if (!started) return
    stoppedToken++
    renderScheduled = false
    started = false
    if (isTTY && lastLines > 0) clearPrevious(lastLines)
    lastLines = 0
  }

  function setStatus(status: string): void {
    if (disabled || !started || !isTTY) return
    statusLine = status
    scheduleRender()
  }

  return { push, start, stop, setStatus }
}
