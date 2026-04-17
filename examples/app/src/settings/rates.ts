export type DeviceBaudRate = 9600 | 19200 | 38400 | 57600 | 115200

export type DeviceSamplingRate = 10 | 20 | 40 | 80 | 160 | 320

export const BAUD_RATE_OPTIONS = [9600, 19200, 38400, 57600, 115200] as const satisfies readonly DeviceBaudRate[]

export const SAMPLING_RATE_OPTIONS = [10, 20, 40, 80, 160, 320] as const satisfies readonly DeviceSamplingRate[]

export function parseBaudRate(value: unknown): DeviceBaudRate | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (BAUD_RATE_OPTIONS.includes(parsed as DeviceBaudRate)) {
    return parsed as DeviceBaudRate
  }

  return null
}

export function parseSamplingRate(value: unknown): DeviceSamplingRate | null {
  const parsed =
    typeof value === "number"
      ? value
      : typeof value === "string" && value.trim().length > 0
        ? Number.parseInt(value, 10)
        : Number.NaN

  if (SAMPLING_RATE_OPTIONS.includes(parsed as DeviceSamplingRate)) {
    return parsed as DeviceSamplingRate
  }

  return null
}
