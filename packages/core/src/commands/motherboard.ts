import type { Commands } from "../commands/types"
/**
 * Warning:
 * Using other commands can seriously harm your device
 */
export const MotherboardCommands: Commands = {
  GET_SERIAL: "#",
  START_WEIGHT_MEAS: "S30",
  STOP_WEIGHT_MEAS: "", // All commands will stop the data stream.
  GET_CALIBRATION: "C",
  SLEEP: 0,
  GET_TEXT: "T",
  DEBUG_STREAM: "D",
}
