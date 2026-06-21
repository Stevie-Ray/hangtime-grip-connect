import { Device } from "../device.model.js"
import type { IFrezDyno } from "../../interfaces/device/frez-dyno.interface.js"

const ONE_SECOND_US = 1_000_000

/**
 * Frez Dyno responses.
 */
enum FrezDynoResponses {
  /**
   * Response received after sending a command to the device.
   */
  RESPONSE_COMMAND,

  /**
   * Data representing a weight measurement from the device.
   */
  RESPONSE_WEIGHT_MEASUREMENT,

  /**
   * Peak rate of force development (RFD) measurement.
   */
  RESPONSE_RFD_PEAK,

  /**
   * Series of peak rate of force development (RFD) measurements.
   */
  RESPONSE_RFD_PEAK_SERIES,

  /**
   * Low battery warning from the device.
   */
  RESPONSE_LOW_POWER_WARNING,
}

/**
 * Format bytes as hex string.
 * @param payload - Bytes to format
 * @param separator - String between bytes (default " ")
 */
function toHex(payload: Uint8Array, separator = " "): string {
  return Array.from(payload)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(separator)
}

/**
 * Represents a Frez Dyno device.
 */
export class FrezDyno extends Device implements IFrezDyno {
  /** Device timestamps in microseconds of recent samples (samples in last 1s device time). */
  private recentSampleTimestamps: number[] = []

  constructor() {
    super({
      filters: [{ namePrefix: "Frez" }, { services: ["da8a6c41-154b-4b9a-9b00-2f84dfcebfe9"] }],
      services: [
        {
          name: "Frez Dyno Service",
          id: "frez-dyno",
          uuid: "da8a6c41-154b-4b9a-9b00-2f84dfcebfe9",
          characteristics: [
            {
              name: "Notify",
              id: "rx",
              uuid: "da8a6c42-154b-4b9a-9b00-2f84dfcebfe9",
            },
            {
              name: "Write",
              id: "tx",
              uuid: "da8a6c43-154b-4b9a-9b00-2f84dfcebfe9",
            },
          ],
        },
        {
          name: "Device Information",
          id: "device",
          uuid: "0000180a-0000-1000-8000-00805f9b34fb",
          characteristics: [
            // {
            //   name: "Serial Number String (Blocked)",
            //   id: "serial",
            //   uuid: "00002a25-0000-1000-8000-00805f9b34fb",
            // },
            {
              name: "Software Revision String",
              id: "software",
              uuid: "00002a28-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
        {
          name: "Battery Service",
          id: "battery",
          uuid: "0000180f-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Battery Level",
              id: "level",
              uuid: "00002a19-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
      ],
      commands: {
        TARE_SCALE: "d", // 100 (0x64)
        START_WEIGHT_MEAS: "e", // 101 (0x65)
        STOP_WEIGHT_MEAS: "f", // 102 (0x66)
        START_PEAK_RFD_MEAS: "g", // 103 (0x67)
        START_PEAK_RFD_MEAS_SERIES: "h", // 104 (0x68)
        GET_BATTERY_VOLTAGE: "o", // 111 (0x6f)
      },
    })
  }

  /**
   * Retrieves battery level from the standard Battery service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery percentage.
   */
  battery = async (): Promise<string | undefined> => {
    return await this.read("battery", "level", 250)
  }

  /**
   * Retrieves battery voltage through the Frez Dyno command characteristic.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery voltage response.
   */
  batteryVoltage = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("frez-dyno", "tx", this.commands.GET_BATTERY_VOLTAGE, 250, (data) => {
      response = data
    })
    return response
  }

  /**
   * Retrieves firmware version from the standard Software Revision characteristic.
   * @returns {Promise<string | undefined>} A Promise that resolves with the firmware version.
   */
  firmware = async (): Promise<string | undefined> => {
    return await this.software()
  }

  /**
   * Retrieves serial number from the standard Device Information service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the serial number.
   */
  serial = async (): Promise<string | undefined> => {
    return await this.read("device", "serial", 250)
  }

  /**
   * Retrieves software version from the standard Device Information service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the software version.
   */
  software = async (): Promise<string | undefined> => {
    return await this.read("device", "software", 250)
  }

  /** True if tare() uses device hardware tare rather than software averaging. */
  readonly usesHardwareTare = true

  override tare(duration = 5000): boolean {
    void duration
    this.clearTareOffset()
    void this.write("frez-dyno", "tx", this.commands.TARE_SCALE, 0)
    return true
  }

  /**
   * Handles data received from the device and processes weight measurements.
   *
   * @param {DataView} value - The notification event.
   */
  override handleNotifications = (value: DataView): void => {
    if (!value?.buffer || value.byteLength < 2) return

    this.updateTimestamp()

    const receivedTime = Date.now()
    const kind = value.getUint8(0)
    const payloadLength = value.getUint8(1)
    if (payloadLength > value.byteLength - 2) return

    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    const payload = bytes.slice(2, 2 + payloadLength)

    if (kind === FrezDynoResponses.RESPONSE_WEIGHT_MEASUREMENT) {
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

        this.peak = Math.max(this.peak, currentMassTotal)
        this.min = Math.min(this.min, currentMassTotal)
        this.sum += currentMassTotal
        this.dataPointCount++
        this.mean = this.sum / this.dataPointCount

        this.downloadPackets.push(
          this.buildDownloadPacket(currentMassTotal, [weight], {
            timestamp: receivedTime,
            sampleIndex: timestampUs,
          }),
        )
        this.activityCheck(currentMassTotal)

        this.recentSampleTimestamps.push(timestampUs)
        const latestUs = this.recentSampleTimestamps[this.recentSampleTimestamps.length - 1] ?? 0
        this.recentSampleTimestamps = this.recentSampleTimestamps.filter((ts) => latestUs - ts <= ONE_SECOND_US)
        const samplingRateHz = this.recentSampleTimestamps.length

        const measurement = this.buildForceMeasurement(currentMassTotal)
        if (measurement.performance) measurement.performance.samplingRateHz = samplingRateHz
        this.notifyCallback(measurement)
      }
    } else if (kind === FrezDynoResponses.RESPONSE_COMMAND) {
      if (!this.writeLast) return

      let output: string
      if (this.writeLast === this.commands.GET_BATTERY_VOLTAGE && payload.length >= 4) {
        output = new DataView(payload.buffer, payload.byteOffset, payload.byteLength).getUint32(0, true).toString()
      } else {
        output = toHex(payload)
      }
      this.writeCallback(output)
    } else if (kind === FrezDynoResponses.RESPONSE_RFD_PEAK) {
      console.warn("Frez Dyno RFD peak is currently unsupported.")
    } else if (kind === FrezDynoResponses.RESPONSE_RFD_PEAK_SERIES) {
      console.warn("Frez Dyno RFD peak series is currently unsupported.")
    } else if (kind === FrezDynoResponses.RESPONSE_LOW_POWER_WARNING) {
      console.warn("Frez Dyno low power warning received.")
    } else {
      throw new Error(`Unknown Frez Dyno message kind detected: ${kind}`)
    }
  }

  /**
   * Stops the data stream on the Frez Dyno.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop = async (): Promise<void> => {
    await this.write("frez-dyno", "tx", this.commands.STOP_WEIGHT_MEAS, 0)
  }

  /**
   * Starts streaming data from the Frez Dyno.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream = async (duration = 0): Promise<void> => {
    this.resetSessionData()
    this.resetPacketTracking()
    this.recentSampleTimestamps = []

    await this.write("frez-dyno", "tx", this.commands.START_WEIGHT_MEAS, duration)

    if (duration !== 0) {
      await this.stop()
    }
  }
}
