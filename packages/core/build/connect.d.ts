import { Device } from "./devices/types";
/**
 * Connect to the BluetoothDevice
 * @param device
 * @param onSuccess
 */
export declare const connect: (board: Device, onSuccess: () => void) => Promise<void>;
