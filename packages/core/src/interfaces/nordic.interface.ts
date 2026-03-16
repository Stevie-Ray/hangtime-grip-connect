import type { IDevice } from "./device.interface.js"

/**
 * Shared Nordic Secure DFU functionality for devices that expose the FE59 DFU service.
 */
export interface INordicDfuDevice extends IDevice {
  /**
   * Switches the device from application mode into the Nordic DFU bootloader.
   */
  dfuSwitch(): Promise<void>

  /**
   * Sends a raw Nordic Secure DFU control operation and resolves with the response payload bytes.
   * Call after dfuSwitch() has reconnected to the DFU bootloader.
   */
  dfuControl(operation: Uint8Array, payload?: ArrayBuffer): Promise<Uint8Array>

  /**
   * Sends Nordic Secure DFU SELECT for command or data objects and returns the bootloader state.
   */
  dfuSelect(objectType: "command" | "data"): Promise<{ maxSize: number; offset: number; crc: number }>

  /**
   * Sends Nordic Secure DFU CREATE for command or data objects.
   */
  dfuCreate(objectType: "command" | "data", size: number): Promise<void>

  /**
   * Writes raw bytes to the Nordic Secure DFU packet characteristic.
   */
  dfuWritePacket(data: Uint8Array | ArrayBuffer): Promise<void>

  /**
   * Sends Nordic Secure DFU CALCULATE_CHECKSUM and returns the bootloader state.
   */
  dfuChecksum(): Promise<{ offset: number; crc: number }>

  /**
   * Sends Nordic Secure DFU EXECUTE for the currently created object.
   */
  dfuExecute(): Promise<void>

  /**
   * Runs a complete Nordic Secure DFU upload: switch to bootloader, send init packet, then send firmware.
   */
  dfuUpload(initPacket: Uint8Array | ArrayBuffer, firmware: Uint8Array | ArrayBuffer): Promise<void>
}
