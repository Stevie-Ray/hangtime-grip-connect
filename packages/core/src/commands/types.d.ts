export interface Commands {
    START_WEIGHT_MEAS?: string;
    STOP_WEIGHT_MEAS?: string;
    SLEEP?: number | string;
    GET_TEXT?: string;
    GET_SERIAL?: string;
    DEBUG_STREAM?: string;
    GET_CALIBRATION?: string;
    TARE_SCALE?: string;
    START_PEAK_RFD_MEAS?: string;
    START_PEAK_RFD_MEAS_SERIES?: string;
    ADD_CALIB_POINT?: string;
    SAVE_CALIB?: string;
    GET_APP_VERSION?: string;
    GET_ERR_INFO?: string;
    CLR_ERR_INFO?: string;
    GET_BATT_VLTG?: string;
}
