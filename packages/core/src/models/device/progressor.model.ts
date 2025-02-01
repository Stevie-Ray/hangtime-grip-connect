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
  COMMAND_RESPONSE,

  /**
   * Data representing a weight measurement from the device.
   * Typically used for tracking load or force applied.
   */
  WEIGHT_MEASURE,

  /**
   * Peak rate of force development (RFD) measurement.
   * This measures how quickly the force is applied over time.
   */
  PEAK_RFD_MEAS,

  /**
   * Series of peak rate of force development (RFD) measurements.
   * This could be used for analyzing force trends over multiple data points.
   */
  PEAK_RFD_MEAS_SERIES,

  /**
   * Low battery warning from the device.
   * Indicates that the battery level is below a critical threshold.
   */
  LOW_BATTERY_WARNING,
}

/**
 * Represents a Tindeq Progressor device.
 * {@link https://tindeq.com}
 */
export class Progressor extends Device implements IProgressor {
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
            {
              name: "Buttonless DFU",
              id: "dfu",
              uuid: "8ec90003-f315-4f60-9fb8-838830daea50",
            },
          ],
        },
      ],
      commands: {
        TARE_SCALE: "d", // 0x64
        START_WEIGHT_MEAS: "e", // 0x65
        STOP_WEIGHT_MEAS: "f", // 0x66
        START_PEAK_RFD_MEAS: "g", //  0x67
        START_PEAK_RFD_MEAS_SERIES: "h", //  0x68
        ADD_CALIB_POINT: "i", //  0x69
        SAVE_CALIB: "j", //  0x6a
        GET_FW_VERSION: "k", //  0x6b
        GET_ERR_INFO: "l", //  0x6c
        CLR_ERR_INFO: "m", //  0x6d
        SLEEP: "n", // 0x6e
        GET_BATT_VLTG: "o", //  0x6f
      },
    })
  }

  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  battery = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("progressor", "tx", this.commands.GET_BATT_VLTG, 250, (data) => {
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
    await this.write("progressor", "tx", this.commands.GET_FW_VERSION, 250, (data) => {
      response = data
    })
    return response
  }

  /**
   * Handles data received from the device, processes weight measurements,
   * and updates mass data including maximum and average values.
   * It also handles command responses for retrieving device information.
   *
   * @param {BluetoothRemoteGATTCharacteristic} characteristic - The notification event.
   */
  override handleNotifications = (characteristic: BluetoothRemoteGATTCharacteristic): void => {
    const value: DataView | undefined = characteristic.value

    if (value) {
      // Update timestamp
      this.updateTimestamp()
      if (value.buffer) {
        const receivedTime: number = Date.now()
        // Read the first byte of the buffer to determine the kind of message
        const kind = value.getInt8(0)
        // Check if the message is a weight measurement
        if (kind === ProgressorResponses.WEIGHT_MEASURE) {
          // Start parsing data from the 3rd byte (index 2)
          let offset = 2
          // Continue parsing while there's data left in the buffer
          while (offset < value.byteLength) {
            // Read a 32-bit float (4 bytes) for the weight, using little-endian
            const weight = value.getFloat32(offset, true)
            // Move the offset by 4 bytes
            offset += 4
            // Read a 32-bit integer (4 bytes) for the seconds, using little-endian
            const seconds = value.getInt32(offset, true)
            // Move the offset by 4 bytes
            offset += 4
            // Check if both weight and seconds are valid numbers
            if (!isNaN(weight) && !isNaN(seconds)) {
              // Tare correction
              const numericData = weight - this.applyTare(weight)
              // Add data to downloadable Array
              this.downloadPackets.push({
                received: receivedTime,
                sampleNum: seconds,
                battRaw: 0,
                samples: [weight],
                masses: [numericData],
              })
              // Check for max weight
              this.massMax = Math.max(Number(this.massMax), Number(numericData)).toFixed(1)
              // Update running sum and count
              const currentMassTotal = Math.max(-1000, Number(numericData))
              this.massTotalSum += currentMassTotal
              this.dataPointCount++

              // Calculate the average dynamically
              this.massAverage = (this.massTotalSum / this.dataPointCount).toFixed(1)

              // Check if device is being used
              this.activityCheck(numericData)

              this.notifyCallback({
                massMax: this.massMax,
                massAverage: this.massAverage,
                massTotal: Math.max(-1000, numericData).toFixed(1),
              })
            }
          }
        } else if (kind === ProgressorResponses.COMMAND_RESPONSE) {
          if (!this.writeLast) return

          let output = ""

          if (this.writeLast === this.commands.GET_BATT_VLTG) {
            output = new DataView(value.buffer, 2).getUint32(0, true).toString()
          } else if (this.writeLast === this.commands.GET_FW_VERSION) {
            output = new TextDecoder().decode(new Uint8Array(value.buffer).slice(2))
          } else if (this.writeLast === this.commands.GET_ERR_INFO) {
            output = new TextDecoder().decode(new Uint8Array(value.buffer.slice(2)))
          }
          this.writeCallback(output)
        } else if (kind === ProgressorResponses.LOW_BATTERY_WARNING) {
          console.warn("⚠️ Low power detected. Please consider connecting to a power source.")
        } else {
          throw new Error(`Unknown message kind detected: ${kind}`)
        }
      }
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
    // Reset download packets
    this.downloadPackets.length = 0
    // Start streaming data
    await this.write("progressor", "tx", this.commands.START_WEIGHT_MEAS, duration)
    // Stop streaming if duration is set
    if (duration !== 0) {
      await this.stop()
    }
  }
}
