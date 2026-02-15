import process from "node:process"
import babar from "babar"

const DEFAULT_BUFFER_SIZE = 80
const DEFAULT_HEIGHT = 10
const REDRAW_MS = 100

// Get the options type from the babar function
type Options = NonNullable<Parameters<typeof babar>[1]>

/**
 * Creates a chart renderer that buffers force values and redraws a babar bar chart.
 * Only active when TTY, not in JSON mode, and disabled is false.
 */
export function createChartRenderer(
  options: Partial<Options> & { bufferSize?: number; redrawMs?: number; disabled?: boolean } = {},
) {
  const {
    bufferSize = DEFAULT_BUFFER_SIZE,
    height = DEFAULT_HEIGHT,
    width = bufferSize,
    redrawMs = REDRAW_MS,
    color = "cyan",
    disabled = false,
  } = options

  const buffer: [number, number][] = []
  let intervalId: ReturnType<typeof setInterval> | null = null
  let lastLines = 0

  function push(value: number): void {
    if (disabled) return
    const clamped = Math.max(0, value)
    const x = buffer.length
    buffer.push([x, clamped])
    if (buffer.length > bufferSize) {
      buffer.shift()
      for (let i = 0; i < buffer.length; i++) {
        buffer[i] = [i, buffer[i][1]]
      }
    }
  }

  function render(): void {
    if (disabled || buffer.length === 0) return
    if (!process.stdout.isTTY) return

    const maxY = Math.max(1, ...buffer.map(([, y]) => y))
    const babarOptions: Options = {
      width,
      height,
      color,
      minY: 0,
      maxY,
      yFractions: 1,
    }
    const chartStr = babar(buffer, babarOptions)

    for (let i = 0; i < lastLines; i++) {
      process.stdout.write("\x1b[1A\x1b[2K")
    }
    lastLines = chartStr.split("\n").length
    process.stdout.write(chartStr + "\n")
  }

  function start(): void {
    if (disabled || !process.stdout.isTTY) return
    lastLines = 0
    intervalId = setInterval(render, redrawMs)
  }

  function stop(): void {
    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }
    for (let i = 0; i < lastLines; i++) {
      process.stdout.write("\x1b[1A\x1b[2K")
    }
    lastLines = 0
  }

  return { push, start, stop }
}
