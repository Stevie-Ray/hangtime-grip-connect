import { Device } from "./devices/types";
/**
 * stream output
 * @param board
 */
export declare const stream: (board: Device, duration?: number) => Promise<void>;
