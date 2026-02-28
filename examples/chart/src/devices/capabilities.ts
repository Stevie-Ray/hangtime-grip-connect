const DYNAMOMETER_DEVICE_KEYS = new Set<string>(["progressor", "forceboard", "whc06"])
const DYNAMOMETER_ONLY_ACTION_IDS = new Set<string>(["peak-force-mvc", "rfd", "critical-force"])
export const MIN_DYNAMIC_TEST_SAMPLING_RATE_HZ = 80

export function isDynamometerDeviceKey(deviceKey: string | null | undefined): boolean {
  return typeof deviceKey === "string" && DYNAMOMETER_DEVICE_KEYS.has(deviceKey)
}

export function isDynamometerOnlyAction(actionId: string): boolean {
  return DYNAMOMETER_ONLY_ACTION_IDS.has(actionId)
}

export function canRunActionWithDeviceKey(actionId: string, deviceKey: string | null | undefined): boolean {
  if (!isDynamometerOnlyAction(actionId)) return true
  return isDynamometerDeviceKey(deviceKey)
}

export function requiresHighSamplingRate(actionId: string): boolean {
  return actionId === "rfd"
}
