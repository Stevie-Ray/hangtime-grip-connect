import { Device } from "../device.model.js"
import type { CTS500BaudRate, CTS500SamplingRate, ICTS500 } from "../../interfaces/device/cts500.interface.js"

const CTS500_HEADER = 0x05
const CTS500_RESPONSE_FLAG = 0x80
const CTS500_ACK_FRAME_LENGTH = 6
const CTS500_DATA_FRAME_LENGTH = 7
const CTS500_RESPONSE_TIMEOUT_MS = 2000

const CTS500_BAUD_RATE_PARAMS: Record<CTS500BaudRate, number> = {
  9600: 0x00,
  19200: 0x01,
  38400: 0x02,
  57600: 0x03,
  115200: 0x04,
}

const CTS500_SAMPLING_RATE_PARAMS: Record<CTS500SamplingRate, number> = {
  10: 0x00,
  20: 0x01,
  40: 0x02,
  80: 0x03,
  160: 0x04,
  320: 0x05,
}

function calculateChecksum(bytes: Uint8Array): number {
  let checksum = 0

  // CTS frames use a simple additive checksum over every byte before the checksum slot.
  for (const byte of bytes) {
    checksum = (checksum + byte) & 0xff
  }

  return checksum
}

function buildCommand(opcode: number, payload: readonly [number, number, number] = [0x00, 0x00, 0x00]): Uint8Array {
  const frame = new Uint8Array(CTS500_ACK_FRAME_LENGTH)
  frame[0] = CTS500_HEADER
  frame[1] = opcode
  frame[2] = payload[0]
  frame[3] = payload[1]
  frame[4] = payload[2]
  frame[5] = calculateChecksum(frame.subarray(0, frame.length - 1))
  return frame
}

interface PendingFrame {
  match(frame: Uint8Array): boolean
  reject(error: Error): void
  resolve(frame: Uint8Array): void
  timeout: ReturnType<typeof setTimeout>
}

/**
 * Represents the CTS500 Climbing Training Scale, marketed as "Jlyscales CTS500".
 * Supplier: Hunan Jinlian Cloud Information Technology Co., Ltd.
 * {@link https://www.huaying-scales.com/}
 * {@link https://www.alibaba.com/product-detail/Mini-Climbing-Training-Scale-CTS500-Aluminum_1601637814595.html}
 */
export class CTS500 extends Device implements ICTS500 {
  private bufferedFrames = new Uint8Array(0)
  private pendingFrame: PendingFrame | undefined = undefined
  private requestQueue: Promise<void> = Promise.resolve()
  private isStreaming = false
  private commandOpcodes = new Set<number>()

  constructor() {
    super({
      filters: [{ name: "CTS-300" }, { name: "CTS500" }],
      services: [
        {
          name: "Device Information",
          id: "device",
          uuid: "0000180a-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Model Number String",
              id: "model",
              uuid: "00002a24-0000-1000-8000-00805f9b34fb", // MY-BT102 https://www.muyusmart.cn/product/my-bt102/
            },
            // {
            //   name: "Serial Number String (Blocked)",
            //   id: "serial",
            //   uuid: "00002a25-0000-1000-8000-00805f9b34fb",
            // },
            {
              name: "Firmware Revision String",
              id: "firmware",
              uuid: "00002a26-0000-1000-8000-00805f9b34fb", // 109a
            },
            {
              name: "Hardware Revision String",
              id: "hardware",
              uuid: "00002a27-0000-1000-8000-00805f9b34fb", //1.0
            },
            {
              name: "Software Revision String",
              id: "software",
              uuid: "00002a28-0000-1000-8000-00805f9b34fb", // 2.1.3
            },
            {
              name: "Manufacturer Name String",
              id: "manufacturer",
              uuid: "00002a29-0000-1000-8000-00805f9b34fb", // DX
            },
          ],
        },
        {
          name: "CTS500 Service",
          id: "cts500",
          uuid: "0000ffe0-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Notify",
              id: "rx",
              uuid: "0000ffe1-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Write",
              id: "tx",
              uuid: "0000ffe2-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
      ],
      commands: {
        SET_RANGE: 0x81, // set capacity/range; known presets include 100kg, 200kg, 300kg, 400kg, 500kg, 1T, and 3T
        SET_DIVISION: 0x82, // set division; known presets include 10g, 20g, 50g, and 0.1kg
        SET_FIRST_CALIBRATION_WEIGHT: 0x83, // set first calibration reference weight; known presets include 1kg, 5kg, 10kg, 20kg, 50kg, and 100kg
        SET_SECOND_CALIBRATION_WEIGHT: 0x84, // set second calibration reference weight; known presets shown include 50kg, 100kg, and 200kg
        POWER_ON_RESET: 0x85, // power-on reset mode; payload 00 disables automatic reset and 01 enables it
        ZERO_SCALE: buildCommand(0x86), // update the hardware zero point
        RUN_FIRST_CALIBRATION: buildCommand(0xa1), // run the first calibration step after placing the configured reference weight
        RUN_SECOND_CALIBRATION: buildCommand(0xa2), // run the second calibration step after placing the configured reference weight
        GET_FIRMWARE_VERSION: buildCommand(0xa4), // read firmware version over the transparent UART service
        TARE_SCALE: buildCommand(0xa6), // tare the current load
        NO_LOAD_CALIBRATION: buildCommand(0xa7), // run the no-load calibration routine with the scale unloaded
        GET_WEIGHT: buildCommand(0xa9), // read the current weight immediately
        START_WEIGHT_MEAS: buildCommand(0xaa), // turn on automatic weight uploading
        STOP_WEIGHT_MEAS: buildCommand(0xab), // turn off automatic weight uploading
        SET_BAUD_RATE: 0xc0, // set UART baud rate; payload presets are 00=9600, 01=19200, 02=38400, 03=57600, 04=115200
        SET_SAMPLING_RATE: 0xc1, // set A/D sampling frequency; payload presets are 00=10Hz, 01=20Hz, 02=40Hz, 03=80Hz, 04=160Hz, 05=320Hz
        SET_SHUTDOWN_TIME: 0xc3, // set auto-shutdown timer; the shown presets use payload 1E for 30 seconds and 00 to disable
        GET_BATTERY_VOLTAGE: buildCommand(0xc4), // read battery voltage
        GET_TEMPERATURE: buildCommand(0xc5), // read temperature
        SET_UPPER_TEMPERATURE_LIMIT: 0xc6, // set upper temperature limit; the shown example uses payload 1D
        SET_LOWER_TEMPERATURE_LIMIT: 0xc7, // set lower temperature limit; the shown example uses payload 2A and FF disables the lower limit
        PEAK_MODE: 0xca, // peak mode; payload 00 turns it off and 01 turns it on
        SET_MAX_WEIGHT_LIMIT: 0xd1, // set the upper/max weight limit threshold
        SET_MIN_WEIGHT_LIMIT: 0xd2, // set the lower/min weight limit threshold
        SET_WEIGHT_ALARM_MODE: 0xd3, // set weight alarm mode; payload 00 cancels, 01 alarms inside the range, and 02 alarms outside the range
        SET_ALARM_OUTPUT: 0xd4, // enable or disable alarm-frame output; payload 00 turns it off and 01 turns it on
      },
    })

    for (const command of Object.values(this.commands)) {
      // Command echoes identify themselves by opcode byte 1 whether the command is stored as a raw opcode or a full frame.
      if (typeof command === "number") {
        this.commandOpcodes.add(command)
      } else if (command instanceof Uint8Array && command.length >= 2) {
        this.commandOpcodes.add(command[1])
      }
    }
  }

  /**
   * Retrieves battery voltage from the device.
   * The returned string uses two decimal places, e.g. "3.55".
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery voltage.
   */
  battery = async (): Promise<string | undefined> => {
    const command = this.commands.GET_BATTERY_VOLTAGE as Uint8Array
    const frame = await this.queryFrame(command, (response) => this.isCommandResponse(response, command[1]))
    if (!frame) {
      return undefined
    }

    const rawVoltage = (frame[4] << 8) | frame[5]
    return (rawVoltage / 100).toFixed(2)
  }

  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the firmware version.
   */
  firmware = async (): Promise<string | undefined> => {
    return await this.read("device", "firmware", 250)
  }

  /**
   * Retrieves hardware version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the hardware version.
   */
  hardware = async (): Promise<string | undefined> => {
    return await this.read("device", "hardware", 250)
  }

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the manufacturer information.
   */
  manufacturer = async (): Promise<string | undefined> => {
    return await this.read("device", "manufacturer", 250)
  }

  /**
   * Retrieves model number from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the model number.
   */
  model = async (): Promise<string | undefined> => {
    return await this.read("device", "model", 250)
  }

  /**
   * Sets whether the device should reset to zero on power-up.
   * @param {boolean} enabled - Whether power-on reset should be enabled.
   * @returns {Promise<void>} A promise that resolves when the command is acknowledged.
   */
  powerOnReset = async (enabled: boolean): Promise<void> => {
    await this.expectAck(this.commands.POWER_ON_RESET as number, [0x00, 0x00, enabled ? 0x01 : 0x00])
  }

  /**
   * Enables or disables the device peak mode.
   * @param {boolean} [enabled=true] - Whether peak mode should be enabled.
   * @returns {Promise<void>} A promise that resolves when the command is acknowledged.
   */
  peakMode = async (enabled = true): Promise<void> => {
    await this.expectAck(this.commands.PEAK_MODE as number, [0x00, 0x00, enabled ? 0x01 : 0x00])
  }

  /**
   * Configures the device UART baud rate.
   * @param {CTS500BaudRate} baudRate - Desired baud rate.
   * @returns {Promise<void>} A promise that resolves when the command is acknowledged.
   */
  setBaudRate = async (baudRate: CTS500BaudRate): Promise<void> => {
    await this.applyConfigCommand(this.commands.SET_BAUD_RATE as number, [
      0x00,
      0x00,
      CTS500_BAUD_RATE_PARAMS[baudRate],
    ])
  }

  /**
   * Configures the device A/D sampling rate.
   * @param {CTS500SamplingRate} samplingRate - Desired A/D sampling rate in Hz.
   * @returns {Promise<void>} A promise that resolves when the command is acknowledged.
   */
  setSamplingRate = async (samplingRate: CTS500SamplingRate): Promise<void> => {
    await this.applyConfigCommand(this.commands.SET_SAMPLING_RATE as number, [
      0x00,
      0x00,
      CTS500_SAMPLING_RATE_PARAMS[samplingRate],
    ])
  }

  /**
   * Retrieves serial number from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the serial number.
   */
  serial = async (): Promise<string | undefined> => {
    const hasSerial = this.services
      .find((service) => service.id === "device")
      ?.characteristics.some((characteristic) => characteristic.id === "serial")

    // MY-BT102 variants can omit the serial characteristic entirely, so guard the read instead of letting it throw.
    if (!hasSerial) {
      return undefined
    }

    return await this.read("device", "serial", 250)
  }

  /**
   * Retrieves software version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the software version.
   */
  software = async (): Promise<string | undefined> => {
    return await this.read("device", "software", 250)
  }

  /**
   * Starts automatic weight uploads.
   * @param {number} [duration=0] - Optional delay before the promise resolves.
   * @returns {Promise<void>} A promise that resolves once upload mode has been enabled.
   */
  stream = async (duration = 0): Promise<void> => {
    this.resetPacketTracking()
    this.isStreaming = true
    const command = this.commands.START_WEIGHT_MEAS as Uint8Array
    await this.queryFrame(
      command,
      (frame) =>
        // The device can start auto-uploading before it echoes the start command, so the first weight frame also confirms success.
        this.isAckFrame(frame, command[1], [command[2], command[3], command[4]]) || this.isWeightFrame(frame),
    )

    if (duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, duration))
    }
  }

  /**
   * Stops automatic weight uploads.
   * @returns {Promise<void>} A promise that resolves once upload mode has been disabled.
   */
  stop = async (): Promise<void> => {
    this.isStreaming = false
    const command = this.commands.STOP_WEIGHT_MEAS as Uint8Array
    await this.queryFrame(command, (frame) => this.isAckFrame(frame, command[1], [command[2], command[3], command[4]]))
  }

  /**
   * Reads the current temperature from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the temperature in Celsius.
   */
  temperature = async (): Promise<string | undefined> => {
    const command = this.commands.GET_TEMPERATURE as Uint8Array
    const frame = await this.queryFrame(command, (response) => this.isCommandResponse(response, command[1]))
    if (!frame) {
      return undefined
    }

    const rawTemperature = frame[5]
    // Negative temperatures are sent as 0x80 + abs(value) instead of two's complement.
    const temperature = rawTemperature >= 0x80 ? -(rawTemperature - 0x80) : rawTemperature
    return temperature.toString()
  }

  /**
   * Uses the device's hardware tare command when connected and falls back to software tare otherwise.
   * @param {number} [duration=5000] - Software tare duration when the device is not connected.
   * @returns {boolean} `true` when the tare operation started successfully.
   */
  override tare = (duration = 5000): boolean => {
    if (!this.isConnected()) {
      return super.tare(duration)
    }

    this.updateTimestamp()
    this.clearTareOffset()
    const command = this.commands.TARE_SCALE as Uint8Array
    void this.queryFrame(command, (frame) =>
      this.isAckFrame(frame, command[1], [command[2], command[3], command[4]]),
    ).catch((error: Error) => {
      console.error(error)
    })
    return true
  }

  /**
   * Reads the current weight from the device in kilograms.
   * @returns {Promise<number | undefined>} A Promise that resolves with the current weight.
   */
  weight = async (): Promise<number | undefined> => {
    const frame = await this.queryFrame(this.commands.GET_WEIGHT, (response) => this.isWeightFrame(response))
    if (!frame) {
      return undefined
    }

    return (frame[2] * 0x1000000 + frame[3] * 0x10000 + frame[4] * 0x100 + frame[5]) / 100
  }

  /**
   * Updates the device hardware zero point.
   * @returns {Promise<void>} A promise that resolves when the command is acknowledged.
   */
  zero = async (): Promise<void> => {
    await this.expectAck(this.commands.ZERO_SCALE as number)
  }

  /**
   * Parses UART frames received over the MY-BT102 notify characteristic.
   * Supports fragmented BLE notifications by buffering until a complete CTS500 frame is available.
   *
   * @param {DataView} value - The notification payload from the device.
   */
  override handleNotifications = (value: DataView): void => {
    this.updateTimestamp()

    const bytes = new Uint8Array(value.byteLength)
    for (let index = 0; index < value.byteLength; index++) {
      bytes[index] = value.getUint8(index)
    }

    if (bytes.length === 0) {
      return
    }

    // BLE notifications can split UART frames arbitrarily, so keep buffering until a full frame validates.
    const combined = new Uint8Array(this.bufferedFrames.length + bytes.length)
    combined.set(this.bufferedFrames)
    combined.set(bytes, this.bufferedFrames.length)
    this.bufferedFrames = combined

    while (this.bufferedFrames.length >= CTS500_ACK_FRAME_LENGTH) {
      const headerIndex = this.bufferedFrames.indexOf(CTS500_HEADER)

      if (headerIndex === -1) {
        this.bufferedFrames = new Uint8Array(0)
        return
      }

      if (headerIndex > 0) {
        this.bufferedFrames = this.bufferedFrames.slice(headerIndex)
      }

      const frame = this.extractNextFrame()
      if (!frame) {
        return
      }

      this.bufferedFrames = this.bufferedFrames.slice(frame.length)
      this.handleFrame(frame)
    }
  }

  /**
   * Waits for a specific frame pattern after sending a CTS500 command.
   */
  private queryFrame = async (
    message: string | Uint8Array | undefined,
    match: (frame: Uint8Array) => boolean,
  ): Promise<Uint8Array | undefined> => {
    return await this.enqueueRequest(async () => {
      const waitForFrame = this.waitForFrame(match)

      try {
        await this.write("cts500", "tx", message, 0)
        return await waitForFrame
      } catch (error) {
        this.clearPendingFrame(error instanceof Error ? error : new Error(String(error)))
        throw error
      }
    })
  }

  /**
   * Sends a command that should be acknowledged with a 6-byte echo frame.
   */
  private expectAck = async (
    opcode: number,
    payload: readonly [number, number, number] = [0x00, 0x00, 0x00],
  ): Promise<void> => {
    await this.queryFrame(buildCommand(opcode, payload), (frame) => this.isAckFrame(frame, opcode, payload))
  }

  /**
   * Sends a configuration command that may reply with either a 6-byte echo, a typed response, or no reply after applying.
   */
  private applyConfigCommand = async (
    opcode: number,
    payload: readonly [number, number, number] = [0x00, 0x00, 0x00],
  ): Promise<void> => {
    try {
      await this.queryFrame(
        buildCommand(opcode, payload),
        (frame) => this.isAckFrame(frame, opcode, payload) || this.isCommandResponse(frame, opcode),
      )
    } catch (error) {
      // Some CTS firmwares apply UART/A-D rate changes immediately and do not echo a matching confirmation frame back over BLE.
      if (error instanceof Error && error.message === "Timed out waiting for CTS500 response") {
        return
      }

      throw error
    }
  }

  /**
   * Resolves the currently pending frame promise if the incoming frame matches.
   * @returns {boolean} Whether a pending request consumed the frame.
   */
  private consumePendingFrame = (frame: Uint8Array): boolean => {
    if (!this.pendingFrame || !this.pendingFrame.match(frame)) {
      return false
    }

    const { resolve, timeout } = this.pendingFrame
    clearTimeout(timeout)
    this.pendingFrame = undefined
    resolve(frame)
    return true
  }

  /**
   * Clears the currently pending frame wait, if any.
   */
  private clearPendingFrame = (error?: Error): void => {
    if (!this.pendingFrame) {
      return
    }

    const { timeout, reject } = this.pendingFrame
    clearTimeout(timeout)
    this.pendingFrame = undefined

    if (error) {
      reject(error)
    }
  }

  /**
   * Extracts the next valid CTS500 frame from the local notification buffer.
   */
  private extractNextFrame = (): Uint8Array | undefined => {
    const secondByte = this.bufferedFrames[1]

    // 6-byte command echoes and 7-byte data frames share the same header, so prefer command echoes when byte 1 is a known opcode.
    if (this.commandOpcodes.has(secondByte) && this.bufferedFrames.length >= CTS500_ACK_FRAME_LENGTH) {
      const commandCandidate = this.bufferedFrames.slice(0, CTS500_ACK_FRAME_LENGTH)
      if (this.isValidFrame(commandCandidate)) {
        return commandCandidate
      }
    }

    if (this.bufferedFrames.length >= CTS500_DATA_FRAME_LENGTH) {
      const dataCandidate = this.bufferedFrames.slice(0, CTS500_DATA_FRAME_LENGTH)
      if (this.isValidFrame(dataCandidate)) {
        return dataCandidate
      }
    }

    if (this.bufferedFrames.length >= CTS500_DATA_FRAME_LENGTH) {
      this.bufferedFrames = this.bufferedFrames.slice(1)
    }

    return undefined
  }

  /**
   * Routes a validated CTS500 frame to pending requests, callbacks, and stream processing.
   */
  private handleFrame = (frame: Uint8Array): void => {
    const matchedPendingRequest = this.consumePendingFrame(frame)

    if (this.isWeightFrame(frame)) {
      // Weight uploads carry a big-endian centi-unit value across bytes 2..5.
      const weight = (frame[2] * 0x1000000 + frame[3] * 0x10000 + frame[4] * 0x100 + frame[5]) / 100
      this.recordWeightMeasurement(weight)
      this.writeCallback(weight.toFixed(2))
      return
    }

    if (this.isCommandResponse(frame, (this.commands.GET_BATTERY_VOLTAGE as Uint8Array)[1])) {
      const voltage = ((frame[4] << 8) | frame[5]) / 100
      this.writeCallback(voltage.toFixed(2))
      return
    }

    if (this.isCommandResponse(frame, (this.commands.GET_TEMPERATURE as Uint8Array)[1])) {
      const rawTemperature = frame[5]
      // Negative temperatures are sent as 0x80 + abs(value) instead of two's complement.
      const temperature = rawTemperature >= 0x80 ? -(rawTemperature - 0x80) : rawTemperature
      this.writeCallback(temperature.toString())
      return
    }

    if (frame.length === CTS500_ACK_FRAME_LENGTH && !matchedPendingRequest) {
      this.writeCallback("OK")
      return
    }

    if (frame.length === CTS500_DATA_FRAME_LENGTH && !matchedPendingRequest) {
      this.writeCallback(
        Array.from(frame)
          .map((byte) => byte.toString(16).padStart(2, "0").toUpperCase())
          .join(" "),
      )
    }
  }

  /**
   * Returns whether a frame is a 6-byte command acknowledgment echo for the given opcode.
   */
  private isAckFrame = (frame: Uint8Array, opcode: number, payload: readonly [number, number, number]): boolean => {
    return (
      frame.length === CTS500_ACK_FRAME_LENGTH &&
      frame[0] === CTS500_HEADER &&
      frame[1] === opcode &&
      frame[2] === payload[0] &&
      frame[3] === payload[1] &&
      frame[4] === payload[2] &&
      this.isValidFrame(frame)
    )
  }

  /**
   * Returns whether a frame is a typed command response (`05 80 <opcode> ... checksum`).
   */
  private isCommandResponse = (frame: Uint8Array, opcode: number): boolean => {
    return (
      frame.length === CTS500_DATA_FRAME_LENGTH &&
      frame[0] === CTS500_HEADER &&
      frame[1] === CTS500_RESPONSE_FLAG &&
      frame[2] === opcode &&
      this.isValidFrame(frame)
    )
  }

  /**
   * Returns whether a frame contains a weight measurement payload.
   */
  private isWeightFrame = (frame: Uint8Array): boolean => {
    return (
      frame.length === CTS500_DATA_FRAME_LENGTH &&
      frame[0] === CTS500_HEADER &&
      frame[1] !== CTS500_RESPONSE_FLAG &&
      !this.commandOpcodes.has(frame[1]) &&
      this.isValidFrame(frame)
    )
  }

  /**
   * Updates rolling statistics and emits a force measurement from a CTS500 weight frame.
   */
  private recordWeightMeasurement = (receivedData: number): void => {
    const receivedTime = Date.now()

    this.currentSamplesPerPacket = 1
    this.recordPacketReceived()

    const numericData = receivedData - this.applyTare(receivedData)
    const currentMassTotal = Math.max(-1000, numericData)

    this.peak = Math.max(this.peak, numericData)
    this.min = Math.min(this.min, Math.max(-1000, numericData))
    this.sum += currentMassTotal
    this.dataPointCount++
    this.mean = this.sum / this.dataPointCount

    this.downloadPackets.push(
      this.buildDownloadPacket(currentMassTotal, [Math.round(receivedData * 100)], {
        timestamp: receivedTime,
        sampleIndex: this.dataPointCount,
      }),
    )

    if (this.isStreaming) {
      void this.activityCheck(numericData)
    }

    this.notifyCallback(this.buildForceMeasurement(currentMassTotal))
  }

  /**
   * Validates a CTS500 frame checksum.
   */
  private isValidFrame = (frame: Uint8Array): boolean => {
    if (frame.length < CTS500_ACK_FRAME_LENGTH || frame[0] !== CTS500_HEADER) {
      return false
    }

    return calculateChecksum(frame.subarray(0, frame.length - 1)) === frame[frame.length - 1]
  }

  /**
   * Registers a pending frame matcher with a timeout.
   */
  private waitForFrame = (
    match: (frame: Uint8Array) => boolean,
    timeoutMs = CTS500_RESPONSE_TIMEOUT_MS,
  ): Promise<Uint8Array> => {
    // CTS uses one transparent UART channel for both commands and telemetry, so only one response wait can be active at a time.
    if (this.pendingFrame) {
      throw new Error("CTS500 already has a pending response request")
    }

    return new Promise<Uint8Array>((resolve, reject) => {
      const timeout = setTimeout(() => {
        if (!this.pendingFrame) {
          return
        }

        this.pendingFrame = undefined
        reject(new Error("Timed out waiting for CTS500 response"))
      }, timeoutMs)

      this.pendingFrame = {
        match,
        reject,
        resolve,
        timeout,
      }
    })
  }

  /**
   * Serializes CTS500 command/response operations so query-style methods can be called in parallel by consumers.
   */
  private enqueueRequest = async <T>(request: () => Promise<T>): Promise<T> => {
    const run = this.requestQueue.then(request, request)
    this.requestQueue = run.then(
      () => undefined,
      () => undefined,
    )
    return await run
  }
}
