import { Device } from "./devices/types";
/**
 * read
 * @param characteristic
 */
export declare const read: (board: Device, serviceId: string, characteristicId: string, duration?: number) => Promise<void>;
