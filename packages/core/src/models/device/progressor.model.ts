import { Device } from "../device.model.js"
import type { IProgressor } from "../../interfaces/device/progressor.interface.js"

/**
 * Progressor responses
 */
enum ProgressorResponses {
  /**
   * Response received after sending a command to the device.
   * This could include acknowledgment or specific data related to the command sent.
   */
  RESPONSE_COMMAND,

  /**
   * Data representing a weight measurement from the device.
   * Typically used for tracking load or force applied.
   */
  RESPONSE_WEIGHT_MEASUREMENT,

  /**
   * Peak rate of force development (RFD) measurement.
   * This measures how quickly the force is applied over time.
   */
  RESPONSE_RFD_PEAK,

  /**
   * Series of peak rate of force development (RFD) measurements.
   * This could be used for analyzing force trends over multiple data points.
   */
  RESPONSE_RFD_PEAK_SERIES,

  /**
   * Low battery warning from the device.
   * Indicates that the battery level is below a critical threshold.
   */
  RESPONSE_LOW_POWER_WARNING,
}

/**
 * Represents a Tindeq Progressor device.
 * {@link https://tindeq.com}
 */
/** One second in microseconds (device timestamp unit). Used for Hz = samples in last 1s. */
const ONE_SECOND_US = 1_000_000

/**
 * Format bytes as hex string.
 * @param payload - Bytes to format
 * @param separator - String between bytes (default " ")
 */
function toHex(payload: Uint8Array, separator = " "): string {
  return Array.from(payload)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join(separator)
}

/**
 * Parse ProgressorId response: u64 little-endian, device may omit trailing zero bytes.
 * Format as hex string MSB-first to match the official app.
 */
function parseProgressorIdPayload(payload: Uint8Array): string {
  if (payload.length === 0) return ""
  const reversed = Uint8Array.from(payload)
  reversed.reverse()
  return toHex(reversed, "").toUpperCase()
}

/**
 * Parse calibration block: 3× float32 LE.
 * value = raw * slope + intercept + trim.
 */
function parseCalibrationCurvePayload(payload: Uint8Array): string {
  const hex = toHex(payload)

  if (payload.length !== 12) return hex

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
  const slope = view.getFloat32(0, true)
  const intercept = view.getFloat32(4, true)
  const trim = view.getFloat32(8, true)
  const effectiveOffset = intercept + trim

  const formatSignedFloat = (value: number): string => {
    const formatted = formatCalibrationFloat(Math.abs(value))
    return value < 0 ? ` - ${formatted}` : ` + ${formatted}`
  }

  return `${hex} — slope: ${formatCalibrationFloat(slope)} | intercept: ${formatCalibrationFloat(intercept)} | trim: ${formatCalibrationFloat(trim)} | effective offset: ${formatCalibrationFloat(effectiveOffset)} | formula: raw * ${formatCalibrationFloat(slope)}${formatSignedFloat(intercept)}${formatSignedFloat(trim)}`
}

/**
 * Format floating-point values for calibration-table display.
 */
function formatCalibrationFloat(value: number): string {
  if (!Number.isFinite(value)) return String(value)
  const abs = Math.abs(value)
  return abs !== 0 && (abs >= 1_000_000 || abs < 0.0001) ? value.toExponential(6) : value.toFixed(6)
}

/**
 * Parse one calibration table record: [u32 lower, u32 upper, f32 slope, f32 intercept].
 */
function parseCalibrationTableRecordPayload(payload: Uint8Array, index: number): string {
  if (payload.length !== 16) return `${String(index).padStart(2, "0")}: ${toHex(payload)}`

  const view = new DataView(payload.buffer, payload.byteOffset, payload.byteLength)
  const lowerRaw = view.getUint32(0, true)
  const upperRaw = view.getUint32(4, true)
  const slope = view.getFloat32(8, true)
  const intercept = view.getFloat32(12, true)
  const hex = toHex(payload)

  return `${String(index).padStart(2, "0")}: ${hex} | raw ${lowerRaw.toLocaleString()}..${upperRaw.toLocaleString()} | slope ${formatCalibrationFloat(slope)} | intercept ${formatCalibrationFloat(intercept)}`
}

export class Progressor extends Device implements IProgressor {
  /** Device timestamps (µs) of recent samples (samples in last 1s device time). */
  private recentSampleTimestamps: number[] = []
  /** 1-based index for multi-packet calibration-table export responses. */
  private calibrationTableRecordIndex = 0

  constructor() {
    super({
      filters: [{ namePrefix: "Progressor" }],
      services: [
        {
          name: "Progressor Service",
          id: "progressor",
          uuid: "7e4e1701-1ea6-40c9-9dcc-13d34ffead57",
          characteristics: [
            {
              name: "Notify",
              id: "rx",
              uuid: "7e4e1702-1ea6-40c9-9dcc-13d34ffead57",
            },
            {
              name: "Write",
              id: "tx",
              uuid: "7e4e1703-1ea6-40c9-9dcc-13d34ffead57",
            },
          ],
        },
        {
          name: "Nordic Device Firmware Update (DFU) Service",
          id: "dfu",
          uuid: "0000fe59-0000-1000-8000-00805f9b34fb",
          characteristics: [
            // {
            //   name: "DFU Control Point",
            //   id: "control",
            //   uuid: "8ec90001-f315-4f60-9fb8-838830daea50",
            // },
            // {
            //   name: "DFU Packet",
            //   id: "packet",
            //   uuid: "8ec90002-f315-4f60-9fb8-838830daea50",
            // },
            {
              name: "Buttonless DFU",
              id: "buttonless",
              uuid: "8ec90003-f315-4f60-9fb8-838830daea50",
            },
          ],
        },
      ],
      // Tindeq API: opcode = single byte (ASCII char code = decimal 100–114 v2 firmware: 115-118)
      commands: {
        TARE_SCALE: "d", // 100 (0x64)
        START_WEIGHT_MEAS: "e", // 101 (0x65)
        STOP_WEIGHT_MEAS: "f", // 102 (0x66)
        START_PEAK_RFD_MEAS: "g", // 103 (0x67)
        START_PEAK_RFD_MEAS_SERIES: "h", // 104 (0x68)
        ADD_CALIBRATION_POINT: "i", // 105 (0x69)
        SAVE_CALIBRATION: "j", // 106 (0x6a)
        GET_FIRMWARE_VERSION: "k", // 107 (0x6b)
        GET_ERROR_INFORMATION: "l", // 108 (0x6c)
        CLR_ERROR_INFORMATION: "m", // 109 (0x6d)
        SLEEP: "n", // 110 (0x6e)
        GET_BATTERY_VOLTAGE: "o", // 111 (0x6f)
        GET_PROGRESSOR_ID: "p", // 112 (0x70)
        SET_CALIBRATION: "q", // 113 (0x71)
        GET_CALIBRATION: "r", // 114 (0x72)
        // V2 FIRMWARE ONLY COMMANDS
        // ADD_CALIBRATION_TABLE_POINT: "s",  // 115 (0x73)
        GET_CALIBRATION_TABLE: "t", // 116 (0x74)
        REBOOT: "u", // 117 (0x75)
        // CLR_CALIBRATION_TABLE: "v",  // 118 (0x76)
      },
    })
  }

  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  battery = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("progressor", "tx", this.commands.GET_BATTERY_VOLTAGE, 250, (data) => {
      response = data
    })
    return response
  }

  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the firmware version,
   */
  firmware = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("progressor", "tx", this.commands.GET_FIRMWARE_VERSION, 250, (data) => {
      response = data
    })
    return response
  }

  /**
   * Retrieves the Progressor ID from the device.
   * @returns {Promise<string>} A Promise that resolves with the raw response (hex of payload).
   */
  progressorId = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("progressor", "tx", this.commands.GET_PROGRESSOR_ID, 250, (data) => {
      response = data
    })
    return response
  }

  /**
   * Retrieves the linear calibration block from the device.
   * Returns raw hex plus decoded slope/intercept/trim coefficients.
   */
  calibration = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("progressor", "tx", this.commands.GET_CALIBRATION, 250, (data) => {
      response = data
    })
    return response
  }

  /**
   * Retrieves the hidden 15-entry piecewise calibration table.
   * Each response packet contains one 16-byte record.
   * @returns {Promise<string | undefined>} Newline-separated decoded records.
   */
  calibrationTable = async (): Promise<string | undefined> => {
    const responses: string[] = []
    this.calibrationTableRecordIndex = 0
    await this.write("progressor", "tx", this.commands.GET_CALIBRATION_TABLE, 1000, (data) => {
      responses.push(data)
    })
    return responses.length > 0 ? responses.join("\n") : undefined
  }

  /**
   * Computes calibration curve from stored points and saves to flash.
   * Requires addCalibrationPoint() for zero and reference. Normal flow: i → i → j.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  saveCalibration = async (): Promise<void> => {
    await this.write("progressor", "tx", this.commands.SAVE_CALIBRATION, 0)
  }

  /**
   * Write calibration block directly (raw overwrite).
   *
   * Payload layout (14 bytes):
   * - [0]   opcode ('q')
   * - [1]   reserved (ignored by firmware)
   * - [2..13] 12-byte calibration block (3× float32 LE: slope, intercept, trim)
   *
   * Notes:
   * - This command does not compute anything; it overwrites stored calibration data.
   * - Sending only the opcode (no 12-byte calibration block) is not a supported "reset" mode.
   *
   * @param curve - Raw 12-byte calibration block (3× float32 LE: slope, intercept, trim) (required).
   * @returns Promise that resolves when the command is sent.
   */
  setCalibration = async (curve: Uint8Array): Promise<void> => {
    if (curve.length !== 12) throw new Error("Curve must be 12 bytes")

    const opcode = (this.commands.SET_CALIBRATION as string).charCodeAt(0)
    const payload = new Uint8Array(14)

    payload[0] = opcode
    payload[1] = 0 // reserved/ignored
    payload.set(curve, 2)

    await this.write("progressor", "tx", payload, 0)
  }

  /**
   * Sets the DFU mode of the device, preparing it for update.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  setDfuMode = async (): Promise<void> => {
    // Sets the DFU mode of a device, preparing it for update
    this.notifyCharacteristicId = "buttonless"

    await this.connect(
      async () => {
        // Enter Bootloader Opcode 0x01
        await this.write("dfu", "buttonless", new Uint8Array([0x01]))
      },
      (error) => console.error("Error setting DFU mode:", error),
    )

    // After we are done: Reset the notify characteristic id to the default
    // this.notifyCharacteristicId = "rx"
  }

  /**
   * Captures a calibration point from the *current live measurement*.
   *
   * Command: 0x69 ('i') written to the control characteristic.
   *
   * The firmware does **not** parse a float payload for this command. It simply snapshots the
   * current raw ADC/force reading and stores it as the next calibration point (typically
   * used as the zero point and the reference point for two-point calibration).
   *
   * Typical two-point calibration flow:
   * 1) Ensure the device is stable with **no load** attached → send addCalibrationPoint() (zero point)
   * 2) Attach a **known weight** and wait until stable      → send addCalibrationPoint() (reference point)
   * 3) Call saveCalibration() ('j') to compute + persist the curve
   *
   * Notes:
   * - Order usually doesn’t matter, but capturing the zero point first is common practice.
   * - Any extra payload bytes are ignored by the firmware for this command.
   *
   * @returns {Promise<void>} Resolves when the command is sent.
   */
  addCalibrationPoint = async (): Promise<void> => {
    const payload = new Uint8Array([(this.commands.ADD_CALIBRATION_POINT as string).charCodeAt(0)]) // 0x69
    await this.write("progressor", "tx", payload, 0)
  }

  /** True if tare() uses device hardware tare rather than software averaging. */
  readonly usesHardwareTare = true

  override tare(duration = 5000): boolean {
    void duration // Accepted for API compatibility; hardware tare ignores it
    this.clearTareOffset()
    void this.write("progressor", "tx", this.commands.TARE_SCALE, 0)
    return true
  }

  /**
   * Puts the device to sleep / shutdown.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  sleep = async (): Promise<void> => {
    const cmd = this.commands.SLEEP
    await this.write("progressor", "tx", typeof cmd === "string" ? cmd : String(cmd), 0)
  }

  /**
   * Reboots the device immediately.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  reboot = async (): Promise<void> => {
    const opcode = (this.commands.REBOOT as string).charCodeAt(0)
    // Send byte 1 to trigger the reboot.
    await this.write("progressor", "tx", new Uint8Array([opcode, 0, 1]), 0)
  }

  /**
   * Retrieves error information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the error info text.
   */
  errorInfo = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("progressor", "tx", this.commands.GET_ERROR_INFORMATION, 250, (data) => {
      response = data
    })
    return response
  }

  /**
   * Clears error information on the device.
   * @returns {Promise<void>} A Promise that resolves when the command is sent.
   */
  clearErrorInfo = async (): Promise<void> => {
    await this.write("progressor", "tx", this.commands.CLR_ERROR_INFORMATION, 0)
  }

  /**
   * Handles data received from the device, processes weight measurements,
   * and updates mass data including maximum and average values.
   * It also handles command responses for retrieving device information.
   *
   * @param {DataView} value - The notification event.
   */
  override handleNotifications = (value: DataView): void => {
    if (!value?.buffer) return
    // Update timestamp
    this.updateTimestamp()

    const receivedTime: number = Date.now()
    // Read the first byte of the buffer to determine the kind of message
    const kind = value.getUint8(0)
    const payloadLength = value.getUint8(1)

    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    const payload = bytes.slice(2, 2 + payloadLength)
    // Check if the message is a weight measurement
    if (kind === ProgressorResponses.RESPONSE_WEIGHT_MEASUREMENT) {
      if (payloadLength % 8 !== 0) return
      const samplesPerPacket = payloadLength / 8
      this.currentSamplesPerPacket = samplesPerPacket
      this.recordPacketReceived()

      for (let i = 0; i < samplesPerPacket; i++) {
        const offset = 2 + i * 8
        const weight = value.getFloat32(offset, true)
        const timestampUs = value.getUint32(offset + 4, true)
        if (Number.isNaN(weight)) continue
        const numericData = weight - this.applyTare(weight)
        const currentMassTotal = Math.max(-1000, Number(numericData))

        // Update session stats before building packet
        this.peak = Math.max(this.peak, Number(numericData))
        this.min = Math.min(this.min, Math.max(-1000, Number(numericData)))
        this.sum += currentMassTotal
        this.dataPointCount++
        this.mean = this.sum / this.dataPointCount

        this.downloadPackets.push(
          this.buildDownloadPacket(currentMassTotal, [weight], {
            timestamp: receivedTime,
            sampleIndex: timestampUs,
          }),
        )
        this.activityCheck(numericData)

        // Hz from device timestamps: keep only samples in last 1s
        this.recentSampleTimestamps.push(timestampUs)
        const latestUs = this.recentSampleTimestamps[this.recentSampleTimestamps.length - 1] ?? 0
        this.recentSampleTimestamps = this.recentSampleTimestamps.filter((ts) => latestUs - ts <= ONE_SECOND_US)
        const samplingRateHz = this.recentSampleTimestamps.length

        const payload = this.buildForceMeasurement(currentMassTotal)
        if (payload.performance) payload.performance.samplingRateHz = samplingRateHz
        this.notifyCallback(payload)
      }
    }
    // Command response
    else if (kind === ProgressorResponses.RESPONSE_COMMAND) {
      if (!this.writeLast) return

      let output: string
      if (this.writeLast === this.commands.GET_BATTERY_VOLTAGE) {
        output = new DataView(payload.buffer, payload.byteOffset, payload.byteLength).getUint32(0, true).toString()
      } else if (this.writeLast === this.commands.GET_FIRMWARE_VERSION) {
        output = new TextDecoder().decode(payload)
      } else if (this.writeLast === this.commands.GET_ERROR_INFORMATION) {
        output = new TextDecoder().decode(payload)
      } else if (this.writeLast === this.commands.GET_PROGRESSOR_ID) {
        output = parseProgressorIdPayload(payload)
      } else if (this.writeLast === this.commands.GET_CALIBRATION) {
        output = parseCalibrationCurvePayload(payload)
      } else if (this.writeLast === this.commands.GET_CALIBRATION_TABLE) {
        this.calibrationTableRecordIndex += 1
        output = parseCalibrationTableRecordPayload(payload, this.calibrationTableRecordIndex)
      } else {
        // Unknown command response: return raw hex
        output = toHex(payload)
      }
      this.writeCallback(output)
    }
    // RFD peak response
    else if (kind === ProgressorResponses.RESPONSE_RFD_PEAK) {
      console.warn("⚠️ RFD peak is currently unsupported.")
    }
    // RFD peak series response
    else if (kind === ProgressorResponses.RESPONSE_RFD_PEAK_SERIES) {
      console.warn("⚠️ RFD peak series is currently unsupported.")
    }
    // Low power warning response
    else if (kind === ProgressorResponses.RESPONSE_LOW_POWER_WARNING) {
      console.warn("⚠️ Low power detected. Please consider connecting to a power source.")
    } else {
      throw new Error(`Unknown message kind detected: ${kind}`)
    }
  }

  /**
   * Stops the data stream on the specified device.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop = async (): Promise<void> => {
    await this.write("progressor", "tx", this.commands.STOP_WEIGHT_MEAS, 0)
  }

  /**
   * Starts streaming data from the specified device.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream = async (duration = 0): Promise<void> => {
    // Reset download packets and session stats for fresh measurement
    this.downloadPackets.length = 0
    this.peak = Number.NEGATIVE_INFINITY
    this.mean = 0
    this.sum = 0
    this.dataPointCount = 0
    this.min = Number.POSITIVE_INFINITY
    this.resetPacketTracking()
    this.recentSampleTimestamps = []
    // Start streaming data
    await this.write("progressor", "tx", this.commands.START_WEIGHT_MEAS, duration)
    // Stop streaming if duration is set
    if (duration !== 0) {
      await this.stop()
    }
  }
}
