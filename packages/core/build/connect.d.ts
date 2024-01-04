import { Device } from "./devices/types";
/**
 * connect
 * @param device
 * @param onSuccess
 */
export declare const connect: (board: Device, onSuccess: () => void) => Promise<void>;
