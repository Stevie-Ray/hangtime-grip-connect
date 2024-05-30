import type { Commands } from "../commands/types"
/**
 * Warning:
 * Using other commands can seriously harm your device
 */
export const ProgressorCommands: Commands = {
  TARE_SCALE: "d", // 0x64,
  START_WEIGHT_MEAS: "e", // 0x65,
  STOP_WEIGHT_MEAS: "f", // 0x66,
  START_PEAK_RFD_MEAS: "g", //  0x67,
  START_PEAK_RFD_MEAS_SERIES: "h", //  0x68,
  ADD_CALIB_POINT: "i", //  0x69,
  SAVE_CALIB: "j", //  0x6a,
  GET_FW_VERSION: "k", //  0x6b,
  GET_ERR_INFO: "l", //  0x6c,
  CLR_ERR_INFO: "m", //  0x6d,
  SLEEP: "n", // 0x6e,
  GET_BATT_VLTG: "o", //  0x6f,
}

/**
 * The Progressor returns a Uint8Array.
 * The first item [0] is the type of response it returns
 */
export const ProgressorResponses = {
  COMMAND_RESPONSE: 0,
  WEIGHT_MEASURE: 1,
  PEAK_RFD_MEAS: 2,
  PEAK_RFD_MEAS_SERIES: 3,
  LOW_BATTERY_WARNING: 4,
}
