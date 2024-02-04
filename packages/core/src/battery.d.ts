import { Device } from "./devices/types";
/**
 * Get Battery / Voltage information
 * @param board
 */
export declare const battery: (board: Device) => Promise<void>;
