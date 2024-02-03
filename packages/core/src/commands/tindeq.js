/**
 * Warning:
 * Using other commands can seriously harm your device
 */
export const TindeqCommands = {
    TARE_SCALE: "d", // 0x64,
    START_WEIGHT_MEAS: "e", // 0x65,
    STOP_WEIGHT_MEAS: "f", // 0x66,
    START_PEAK_RFD_MEAS: "g", //  0x67,
    START_PEAK_RFD_MEAS_SERIES: "h", //  0x68,
    ADD_CALIB_POINT: "i", //  0x69,
    SAVE_CALIB: "j", //  0x6a,
    GET_APP_VERSION: "k", //  0x6b,
    GET_ERR_INFO: "l", //  0x6c,
    CLR_ERR_INFO: "m", //  0x6d,
    SLEEP: "n", // 0x6e,
    GET_BATT_VLTG: "o", //  0x6f,
};
export const NotificationTypes = {
    COMMAND_RESPONSE: 0,
    WEIGHT_MEASURE: 1,
    LOW_BATTERY_WARNING: 2,
};
