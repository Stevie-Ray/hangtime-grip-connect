import { Device } from "./types";
export declare const Tindeq: Device;
export declare const Commands: {
    TARE_SCALE: number;
    START_MEASURING: number;
    STOP_MEASURING: number;
    GET_APP_VERSION: number;
    GET_ERROR_INFO: number;
    CLEAR_ERR_INFO: number;
    GET_BATTERY_LEVEL: number;
    SLEEP: number;
};
export declare const NotificationTypes: {
    COMMAND_RESPONSE: number;
    WEIGHT_MEASURE: number;
    LOW_BATTERY_WARNING: number;
};
