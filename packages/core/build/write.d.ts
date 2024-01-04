import { Device } from "./devices/types";
/**
 * write
 * @param characteristic
 * @param message
 */
export declare const write: (board: Device, serviceId: string, characteristicId: string, message: string, duration?: number) => Promise<void>;
