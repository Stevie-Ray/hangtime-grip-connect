const DYNAMOMETER_DEVICE_KEYS = new Set<string>(["progressor", "forceboard", "cts500", "wh-c06"])
const DYNAMOMETER_ONLY_ACTION_IDS = new Set<string>(["peak-force-mvc", "rfd", "critical-force"])

export function isDynamometerDeviceKey(deviceKey: string): boolean {
  return DYNAMOMETER_DEVICE_KEYS.has(deviceKey.toLowerCase())
}

export function isDynamometerOnlyActionId(actionId: string | undefined): boolean {
  return typeof actionId === "string" && DYNAMOMETER_ONLY_ACTION_IDS.has(actionId)
}
