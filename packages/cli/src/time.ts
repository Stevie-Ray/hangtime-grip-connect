export function formatClock(totalSeconds: number): string {
  const safe = Math.max(0, Math.trunc(totalSeconds))
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
}

export function parseSecondsLikeInput(input: string, label = "value"): number {
  const value = input.trim()
  if (value.length === 0) {
    throw new Error(`Invalid ${label}: ${input}. Use mm:ss or a non-negative number of seconds.`)
  }

  if (!value.includes(":")) {
    const seconds = Number.parseFloat(value)
    if (!Number.isFinite(seconds) || seconds < 0) {
      throw new Error(`Invalid ${label}: ${input}. Use mm:ss or a non-negative number of seconds.`)
    }
    return seconds
  }

  const [minutesRaw, secondsRaw, extra] = value.split(":")
  if (extra !== undefined) {
    throw new Error(`Invalid ${label}: ${input}. Use mm:ss or a non-negative number of seconds.`)
  }

  const minutes = Number.parseInt(minutesRaw ?? "", 10)
  const seconds = Number.parseInt(secondsRaw ?? "", 10)
  if (!Number.isFinite(minutes) || !Number.isFinite(seconds) || minutes < 0 || seconds < 0 || seconds > 59) {
    throw new Error(`Invalid ${label}: ${input}. Use mm:ss or a non-negative number of seconds.`)
  }

  return minutes * 60 + seconds
}
