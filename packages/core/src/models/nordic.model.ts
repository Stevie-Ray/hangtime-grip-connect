import { Device } from "./device.model.js"
import type { Service } from "../interfaces/device.interface.js"
import type { INordicDfuDevice } from "../interfaces/nordic.interface.js"

const NORDIC_DFU_SERVICE_UUID = "0000fe59-0000-1000-8000-00805f9b34fb"
const DFU_PACKET_SIZE = 20
// Keep CRC values in signed int32 form so they compare directly with DataView.getInt32() responses from the bootloader.
const CRC32_TABLE = (() => {
  const table = new Int32Array(256)

  for (let index = 0; index < 256; index++) {
    let crc = index
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 1) !== 0 ? 0xedb88320 ^ (crc >>> 1) : crc >>> 1
    }
    table[index] = crc | 0
  }

  return table
})()

/**
 * Creates a fresh Nordic Secure DFU service definition.
 * Characteristics are mutable at runtime, so each device instance needs its own copy.
 * @returns {Service} A new DFU service descriptor with control, packet, and buttonless characteristics.
 */
export function createNordicDfuService(): Service {
  return {
    name: "Nordic Device Firmware Update (DFU) Service",
    id: "dfu",
    uuid: NORDIC_DFU_SERVICE_UUID,
    characteristics: [
      {
        name: "DFU Control Point",
        id: "control",
        uuid: "8ec90001-f315-4f60-9fb8-838830daea50",
      },
      {
        name: "DFU Packet",
        id: "packet",
        uuid: "8ec90002-f315-4f60-9fb8-838830daea50",
      },
      {
        name: "Buttonless DFU",
        id: "buttonless",
        uuid: "8ec90003-f315-4f60-9fb8-838830daea50",
      },
    ],
  }
}

/**
 * Shared Nordic Secure DFU implementation for devices exposing the FE59 service.
 */
export abstract class NordicDfuDevice extends Device implements INordicDfuDevice {
  /**
   * Returns a cached DFU characteristic discovered during the current GATT session.
   * @param {"control" | "packet" | "buttonless"} characteristicId - The DFU characteristic identifier.
   * @returns {BluetoothRemoteGATTCharacteristic | undefined} The discovered characteristic, if available.
   */
  private getDfuCharacteristic(
    characteristicId: "control" | "packet" | "buttonless",
  ): BluetoothRemoteGATTCharacteristic | undefined {
    return this.services
      .find((service) => service.id === "dfu")
      ?.characteristics.find((characteristic) => characteristic.id === characteristicId)?.characteristic
  }

  /**
   * Checks whether the connected device is already exposing the DFU bootloader characteristics.
   * @returns {boolean} `true` when both control and packet characteristics are available.
   */
  private hasDfuBootloaderCharacteristics(): boolean {
    return this.getDfuCharacteristic("control") != null && this.getDfuCharacteristic("packet") != null
  }

  /**
   * Wraps the shared connect flow so DFU callers get a rejected promise when connection setup fails.
   * @returns {Promise<void>} Resolves when discovery is complete.
   */
  private async connectForDfu(): Promise<void> {
    await new Promise<void>((resolve, reject) => {
      void this.connect(
        () => resolve(),
        (error) => reject(error),
      )
    })
  }

  /**
   * Prompts for a Bluetooth device matching the provided filters, then runs the normal service discovery flow.
   * @param {BluetoothLEScanFilter[]} filters - Alternative device filters to pass to `requestDevice`.
   * @returns {Promise<void>} Resolves after the selected device is connected and characteristics are cached.
   */
  private async requestAndConnectDfuDevice(filters: BluetoothLEScanFilter[]): Promise<void> {
    const bluetooth = await this.getBluetooth()
    // Clear any stale GATT state before replacing the selected device with the bootloader identity.
    this.disconnect()
    delete this.bluetooth
    this.bluetooth = await bluetooth.requestDevice({
      filters,
      optionalServices: this.getAllServiceUUIDs(),
    })
    await this.connectForDfu()
  }

  /**
   * Ensures there is an active connection to either the application or DFU bootloader variant of the device.
   * @returns {Promise<void>} Resolves after a DFU-capable device has been connected and discovered.
   */
  private async ensureDfuCapableConnection(): Promise<void> {
    if (this.bluetooth?.gatt) {
      try {
        await this.connectForDfu()
        return
      } catch {
        // If the previously granted device no longer reconnects, fall back to a fresh picker.
        this.disconnect()
        delete this.bluetooth
      }
    }

    await this.requestAndConnectDfuDevice([...this.filters, { services: [NORDIC_DFU_SERVICE_UUID] }])
  }

  /**
   * Prompts for the rebooted Nordic DFU bootloader after the application switches into buttonless DFU mode.
   * @returns {Promise<void>} Resolves after the bootloader device is selected and connected.
   */
  private async connectDfuBootloader(): Promise<void> {
    try {
      await this.requestAndConnectDfuDevice([{ services: [NORDIC_DFU_SERVICE_UUID] }])
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error"
      const wrappedError = new Error(
        `Device entered DFU mode. Select the Nordic DFU bootloader to continue. ${message}`,
      )
      ;(wrappedError as Error & { cause?: unknown }).cause = error
      throw wrappedError
    }

    if (!this.hasDfuBootloaderCharacteristics()) {
      throw new Error("Selected device did not expose the Nordic DFU control and packet characteristics.")
    }
  }

  /**
   * Normalizes DFU payload inputs to `Uint8Array` so packet slicing and CRC calculation use one byte representation.
   * @param {Uint8Array | ArrayBuffer} data - Raw DFU payload bytes.
   * @returns {Uint8Array} The payload as a `Uint8Array`.
   */
  private toDfuBytes(data: Uint8Array | ArrayBuffer): Uint8Array {
    return data instanceof Uint8Array ? data : new Uint8Array(data)
  }

  /**
   * Calculates the Nordic Secure DFU CRC32 for the given payload prefix.
   * @param {Uint8Array} data - The bytes to checksum.
   * @returns {number} The signed 32-bit CRC value returned by Nordic DFU checksum responses.
   */
  private dfuCrc32(data: Uint8Array): number {
    let crc = 0xffffffff

    for (const byte of data) {
      const tableEntry = CRC32_TABLE[(crc ^ byte) & 0xff]
      if (tableEntry === undefined) {
        throw new Error("CRC32 lookup index out of range")
      }
      crc = tableEntry ^ (crc >>> 8)
    }

    return (crc ^ 0xffffffff) | 0
  }

  /**
   * Formats a signed CRC value as an unsigned hexadecimal string for error messages.
   * @param {number} crc - The CRC value to format.
   * @returns {string} The CRC formatted as `0x????????`.
   */
  private formatDfuCrc(crc: number): string {
    return `0x${(crc >>> 0).toString(16).padStart(8, "0")}`
  }

  /**
   * Transfers one Nordic Secure DFU object type, handling resume, chunking, checksum validation, and execute steps.
   * @param {"command" | "data"} objectType - The DFU object type to transfer.
   * @param {Uint8Array | ArrayBuffer} data - The full payload for that object type.
   * @returns {Promise<void>} Resolves when the payload has been fully transferred and validated.
   */
  private async dfuTransferObject(objectType: "command" | "data", data: Uint8Array | ArrayBuffer): Promise<void> {
    const bytes = this.toDfuBytes(data)
    if (bytes.byteLength === 0) {
      throw new Error(`DFU ${objectType.toUpperCase()} payload is required`)
    }

    const { maxSize, offset, crc } = await this.dfuSelect(objectType)
    if (maxSize <= 0) {
      throw new Error(`DFU ${objectType.toUpperCase()} maxSize ${maxSize} is invalid`)
    }
    if (offset > bytes.byteLength) {
      throw new Error(`DFU ${objectType.toUpperCase()} offset ${offset} exceeds payload size ${bytes.byteLength}`)
    }
    // Validate the bootloader's resume point before sending more bytes; otherwise a resumed transfer could continue from a corrupt state.
    if (offset > 0) {
      const expectedCrc = this.dfuCrc32(bytes.slice(0, offset))
      if (expectedCrc !== crc) {
        throw new Error(
          `DFU ${objectType.toUpperCase()} resume CRC mismatch at offset ${offset}: expected ${this.formatDfuCrc(expectedCrc)}, got ${this.formatDfuCrc(crc)}`,
        )
      }
    }
    if (offset === bytes.byteLength) {
      return
    }

    // The bootloader may report an offset in the middle of an object; restart from that object's boundary.
    for (let objectStart = offset - (offset % maxSize); objectStart < bytes.byteLength; ) {
      const objectEnd = Math.min(objectStart + maxSize, bytes.byteLength)
      await this.dfuCreate(objectType, objectEnd - objectStart)

      // Packet writes stay at 20 bytes for Web Bluetooth compatibility with the default ATT payload size.
      for (let packetStart = objectStart; packetStart < objectEnd; packetStart += DFU_PACKET_SIZE) {
        await this.dfuWritePacket(bytes.slice(packetStart, Math.min(packetStart + DFU_PACKET_SIZE, objectEnd)))
      }

      // Nordic reports checksum state for the whole transferred prefix, not just the current object chunk.
      const state = await this.dfuChecksum()
      if (state.offset !== objectEnd) {
        throw new Error(`DFU ${objectType.toUpperCase()} checksum offset ${state.offset} did not match ${objectEnd}`)
      }
      const expectedCrc = this.dfuCrc32(bytes.slice(0, state.offset))
      if (state.crc !== expectedCrc) {
        throw new Error(
          `DFU ${objectType.toUpperCase()} checksum CRC mismatch at offset ${state.offset}: expected ${this.formatDfuCrc(expectedCrc)}, got ${this.formatDfuCrc(state.crc)}`,
        )
      }

      await this.dfuExecute()
      objectStart = state.offset
    }
  }

  /**
   * Switches the device from application mode into the Nordic DFU bootloader.
   * @returns {Promise<void>} Resolves after the device reboots into DFU mode and reconnects to the bootloader.
   */
  dfuSwitch = async (): Promise<void> => {
    // Reuse the existing connect/onConnected path, but subscribe to the buttonless DFU notifier.
    this.notifyCharacteristicId = "buttonless"

    try {
      await this.ensureDfuCapableConnection()
      if (this.hasDfuBootloaderCharacteristics()) {
        return
      }

      if (!this.getDfuCharacteristic("buttonless")) {
        throw new Error('Characteristic "buttonless" not found in service "dfu".')
      }

      const device = this.bluetooth
      if (!device?.gatt?.connected) {
        throw new Error("Device must be connected before entering DFU mode")
      }

      await new Promise<void>((resolve, reject) => {
        const cleanup = (): void => {
          device.removeEventListener("gattserverdisconnected", onDisconnected)
        }

        const onDisconnected = (): void => {
          // Entering buttonless DFU reboots the device, so disconnect is the success signal here.
          cleanup()
          resolve()
        }

        device.addEventListener("gattserverdisconnected", onDisconnected, { once: true })

        // Opcode 0x01 requests a switch from application mode into the Nordic DFU bootloader.
        this.write("dfu", "buttonless", new Uint8Array([0x01])).catch((error) => {
          cleanup()
          reject(error)
        })
      })

      // After the reboot, prompt for the bootloader explicitly instead of assuming the browser will reconnect to the same BLE identity.
      await this.connectDfuBootloader()
    } finally {
      // Restore the normal application notify characteristic after the DFU transition attempt.
      this.notifyCharacteristicId = "rx"
    }
  }

  /**
   * Sends a raw Nordic Secure DFU control operation and resolves with the response payload bytes.
   * Call after dfuSwitch() has reconnected to the DFU bootloader.
   * @param {Uint8Array} operation - The DFU control opcode bytes to send.
   * @param {ArrayBuffer} [payload] - Optional payload appended to the opcode.
   * @returns {Promise<Uint8Array>} Resolves with the response payload bytes after the 3-byte Nordic response header.
   */
  dfuControl = async (operation: Uint8Array, payload?: ArrayBuffer): Promise<Uint8Array> => {
    if (operation.length === 0) {
      throw new Error("DFU control operation is required")
    }

    const control = this.getDfuCharacteristic("control")

    if (!control) {
      throw new Error('Characteristic "control" not found in service "dfu". Call dfuSwitch() first.')
    }

    const value = new Uint8Array(operation.length + (payload?.byteLength ?? 0))
    value.set(operation)
    if (payload) {
      value.set(new Uint8Array(payload), operation.length)
    }

    await control.startNotifications()

    return await new Promise<Uint8Array>((resolve, reject) => {
      const cleanup = (): void => {
        control.removeEventListener("characteristicvaluechanged", onNotification)
      }

      const onNotification = (event: Event): void => {
        const target = event.target as BluetoothRemoteGATTCharacteristic
        const view = target.value

        // Control responses are framed as 0x60 <opcode> <status> [...payload].
        if (!view || view.getUint8(0) !== 0x60 || view.getUint8(1) !== operation[0]) {
          return
        }

        cleanup()

        const status = view.getUint8(2)
        if (status === 0x01) {
          const response = new Uint8Array(view.buffer, view.byteOffset + 3, view.byteLength - 3)
          resolve(Uint8Array.from(response))
          return
        }

        if (status === 0x0b && view.byteLength > 3) {
          reject(
            new Error(`DFU control failed with extended error 0x${view.getUint8(3).toString(16).padStart(2, "0")}`),
          )
          return
        }

        reject(new Error(`DFU control failed with status 0x${status.toString(16).padStart(2, "0")}`))
      }

      control.addEventListener("characteristicvaluechanged", onNotification)

      control.writeValue(value).catch((error) => {
        cleanup()
        reject(error)
      })
    })
  }

  /**
   * Sends Nordic Secure DFU SELECT for command or data objects and returns the bootloader state.
   * @param {"command" | "data"} objectType - The object type to query.
   * @returns {Promise<{ maxSize: number; offset: number; crc: number }>} The bootloader's object size, offset, and CRC state.
   */
  dfuSelect = async (objectType: "command" | "data"): Promise<{ maxSize: number; offset: number; crc: number }> => {
    const response = await this.dfuControl(new Uint8Array([0x06, objectType === "command" ? 0x01 : 0x02]))

    if (response.byteLength < 12) {
      throw new Error("DFU SELECT response was shorter than expected")
    }

    const view = new DataView(response.buffer, response.byteOffset, response.byteLength)
    return {
      maxSize: view.getUint32(0, true),
      offset: view.getUint32(4, true),
      crc: view.getInt32(8, true),
    }
  }

  /**
   * Sends Nordic Secure DFU CREATE for command or data objects.
   * @param {"command" | "data"} objectType - The object type to create.
   * @param {number} size - The size of the object chunk to allocate in bytes.
   * @returns {Promise<void>} Resolves when the bootloader accepts the object allocation request.
   */
  dfuCreate = async (objectType: "command" | "data", size: number): Promise<void> => {
    if (!Number.isFinite(size) || size < 0) {
      throw new Error("DFU CREATE size must be a non-negative number")
    }

    const payload = new ArrayBuffer(4)
    new DataView(payload).setUint32(0, size, true)

    await this.dfuControl(new Uint8Array([0x01, objectType === "command" ? 0x01 : 0x02]), payload)
  }

  /**
   * Writes raw bytes to the Nordic Secure DFU packet characteristic.
   * @param {Uint8Array | ArrayBuffer} data - The packet payload bytes to send.
   * @returns {Promise<void>} Resolves after the packet has been written.
   */
  dfuWritePacket = async (data: Uint8Array | ArrayBuffer): Promise<void> => {
    await this.write("dfu", "packet", data instanceof Uint8Array ? data : new Uint8Array(data), 0)
  }

  /**
   * Sends Nordic Secure DFU CALCULATE_CHECKSUM and returns the bootloader state.
   * @returns {Promise<{ offset: number; crc: number }>} The bootloader's transferred offset and CRC for the current object stream.
   */
  dfuChecksum = async (): Promise<{ offset: number; crc: number }> => {
    const response = await this.dfuControl(new Uint8Array([0x03]))

    if (response.byteLength < 8) {
      throw new Error("DFU CHECKSUM response was shorter than expected")
    }

    const view = new DataView(response.buffer, response.byteOffset, response.byteLength)
    return {
      offset: view.getUint32(0, true),
      crc: view.getInt32(4, true),
    }
  }

  /**
   * Sends Nordic Secure DFU EXECUTE for the currently created object.
   * @returns {Promise<void>} Resolves when the bootloader executes the current DFU object.
   */
  dfuExecute = async (): Promise<void> => {
    await this.dfuControl(new Uint8Array([0x04]))
  }

  /**
   * Runs a complete Nordic Secure DFU upload: switch to bootloader, send init packet, then send firmware.
   * @param {Uint8Array | ArrayBuffer} initPacket - The Nordic Secure DFU init packet bytes.
   * @param {Uint8Array | ArrayBuffer} firmware - The firmware image bytes to upload.
   * @returns {Promise<void>} Resolves after the firmware upload completes and the bootloader disconnects to reboot.
   */
  dfuUpload = async (initPacket: Uint8Array | ArrayBuffer, firmware: Uint8Array | ArrayBuffer): Promise<void> => {
    await this.dfuSwitch()
    await this.dfuTransferObject("command", initPacket)

    const device = this.bluetooth
    if (!device?.gatt?.connected) {
      throw new Error("Device disconnected before firmware transfer started")
    }

    // Attach the listener before the final data phase so a fast reboot cannot disconnect before we start waiting.
    const waitForDisconnect = new Promise<void>((resolve) => {
      const onDisconnected = (): void => {
        device.removeEventListener("gattserverdisconnected", onDisconnected)
        resolve()
      }

      device.addEventListener("gattserverdisconnected", onDisconnected, { once: true })
    })

    await this.dfuTransferObject("data", firmware)

    // Some browsers observe the disconnect before the awaited transfer returns, so avoid waiting twice.
    if (!device.gatt?.connected) {
      return
    }

    await waitForDisconnect
  }
}
