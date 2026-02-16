import process from "node:process"
import { plot, blue, red, yellow } from "asciichart"

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
}

/** Data point pushed to the chart: current, mean, and peak force values. */
export interface ChartDataPoint {
  current: number
  mean: number
  peak: number
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
  const { bufferSize = DEFAULT_BUFFER_SIZE, height = DEFAULT_HEIGHT, disabled = false, unit = "kg" } = options

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
      `Current: ${lastCurrent.toFixed(2)} ${unit}` +
      `  Max: ${lastPeak.toFixed(2)} ${unit}` +
      `  Avg: ${lastMean.toFixed(2)} ${unit}`

    // Track line count so we can overwrite the previous frame cleanly
    const nl = countNewlines(chartStr)
    const chartLineCount = nl + (chartStr.endsWith("\n") ? 0 : 1)
    const totalLines = chartLineCount + 1 // + stats line

    if (lastLines > 0) clearPrevious(lastLines)
    lastLines = totalLines

    process.stdout.write(chartStr)
    if (!chartStr.endsWith("\n")) process.stdout.write("\n")
    process.stdout.write(statsLine + "\n")
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

  return { push, start, stop }
}
