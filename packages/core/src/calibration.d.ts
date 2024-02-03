import { Device } from "./devices/types";
/**
 * write command to get calibration
 * @param board
 */
export declare const calibration: (board: Device) => Promise<void>;
