import { Device } from "../device.model.js"
import type { IForceBoard } from "../../interfaces/device/forceboard.interface.js"

/**
 * Represents a PitchSix Force Board device.
 * {@link https://pitchsix.com}
 */
export class ForceBoard extends Device implements IForceBoard {
  protected override streamUnit = "lbs" as const

  constructor() {
    super({
      filters: [{ name: "Force Board" }],
      services: [
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
            // {
            //   name: "Firmware Revision String (Blocked)",
            //   id: "firmware",
            //   uuid: "00002a26-0000-1000-8000-00805f9b34f",
            // },
            {
              name: "Manufacturer Name String",
              id: "manufacturer",
              uuid: "00002a29-0000-1000-8000-00805f9b34fb",
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
        {
          name: "",
          id: "",
          uuid: "f3641400-00b0-4240-ba50-05ca45bf8abc",
          characteristics: [
            {
              name: "Read + Indicate",
              id: "",
              uuid: "f3641401-00b0-4240-ba50-05ca45bf8abc",
            },
          ],
        },
        {
          name: "Humidity Service",
          id: "humidity",
          uuid: "cf194c6f-d0c1-47b2-aeff-dc610f09bd18",
          characteristics: [
            {
              name: "Humidity Level",
              id: "level",
              uuid: "cf194c70-d0c1-47b2-aeff-dc610f09bd18",
            },
          ],
        },
        {
          name: "Temperature Serivce",
          id: "temperature",
          uuid: "3a90328c-c266-4c76-b05a-6af6104a0b13",
          characteristics: [
            {
              name: "Read",
              id: "level",
              uuid: "3a90328d-c266-4c76-b05a-6af6104a0b13",
            },
          ],
        },
        {
          name: "Forceboard Service",
          id: "forceboard",
          uuid: "9a88d67f-8df2-4afe-9e0d-c2bbbe773dd0",
          characteristics: [
            {
              name: "Write",
              id: "",
              uuid: "9a88d680-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Read + Indicate",
              id: "",
              uuid: "9a88d681-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Force Data",
              id: "rx",
              uuid: "9a88d682-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Tare",
              id: "tare",
              uuid: "9a88d683-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Read",
              id: "",
              uuid: "9a88d685-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Threshold",
              id: "threshold",
              uuid: "9a88d686-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Read + Write",
              id: "",
              uuid: "9a88d687-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Serial / Read + Write",
              id: "",
              uuid: "9a88d688-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Read + Write",
              id: "",
              uuid: "9a88d689-8df2-4afe-9e0d-c2bbbe773dd0",
            },
          ],
        },
        {
          name: "Weight Service",
          id: "weight",
          uuid: "467a8516-6e39-11eb-9439-0242ac130002",
          characteristics: [
            {
              name: "Device Mode",
              id: "tx",
              uuid: "467a8517-6e39-11eb-9439-0242ac130002",
            },
            {
              name: "Read + Write",
              id: "",
              uuid: "467a8518-6e39-11eb-9439-0242ac130002",
            },
          ],
        },
      ],
      commands: {
        START_WEIGHT_MEAS: String.fromCharCode(0x04), // Streaming Data Mode: continuously streams force data.
        TARE_SCALE: String.fromCharCode(0x05), // Tare function: zeroes out the current load value
        START_QUICK_MEAS: String.fromCharCode(0x06), // Quick Start Mode: Starts data transmission when a force value exceeds the Threshold and stops data transmission when the force data drops below the Threshold.
        STOP_WEIGHT_MEAS: String.fromCharCode(0x07), // Idle Mode: Force Board is idle.
      },
    })
  }

  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  battery = async (): Promise<string | undefined> => {
    return await this.read("battery", "level", 250)
  }

  /**
   * Handles data received from the device, processes weight measurements,
   * and updates mass data including maximum and average values.
   * It also handles command responses for retrieving device information.
   *
   * @param {DataView} value - The notification event.
   */
  override handleNotifications = (value: DataView): void => {
    if (value) {
      this.updateTimestamp()
      if (value.buffer) {
        const receivedTime: number = Date.now()
        const dataArray = new Uint8Array(value.buffer)

        const numSamples = (dataArray[0] << 8) | dataArray[1]
        this.currentSamplesPerPacket = numSamples
        this.recordPacketReceived()

        for (let i = 0; i < numSamples; i++) {
          const offset = 2 + i * 3 // Skip the first 2 bytes which indicate number of samples
          if (offset + 2 < dataArray.length) {
            // Sample = byte1*32768 + byte2*256 + byte3 (device streams in LBS)
            const receivedData = dataArray[offset] * 32768 + dataArray[offset + 1] * 256 + dataArray[offset + 2]
            // Tare correction
            const numericData = receivedData - this.applyTare(receivedData)
            // Add data to downloadable Array (raw and tare-adjusted, both in LBS)
            this.downloadPackets.push({
              received: receivedTime,
              sampleNum: this.dataPointCount,
              battRaw: 0,
              samples: [receivedData],
              masses: [numericData],
            })

            // Update peak and min
            this.peak = Math.max(this.peak, numericData)
            this.min = Math.min(this.min, Math.max(-1000, numericData))

            // Update running sum and count
            const currentMassTotal = Math.max(-1000, numericData)
            this.sum += currentMassTotal
            this.dataPointCount++

            // Calculate the average dynamically
            this.mean = this.sum / this.dataPointCount

            // Check if device is being used
            this.activityCheck(numericData)

            // Notify with weight data
            this.notifyCallback(this.buildForceMeasurement(Math.max(-1000, numericData)))
          }
        }
      }
    }
  }

  /**
   * Retrieves humidity level from the device.
   * @returns {Promise<string>} A Promise that resolves with the humidity level,
   */
  humidity = async (): Promise<string | undefined> => {
    return await this.read("humidity", "level", 250)
  }

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string>} A Promise that resolves with the manufacturer information,
   */
  manufacturer = async (): Promise<string | undefined> => {
    return await this.read("device", "manufacturer", 250)
  }

  /**
   * Stops the data stream on the specified device by setting it to Idle mode.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop = async (): Promise<void> => {
    await this.write("weight", "tx", this.commands.STOP_WEIGHT_MEAS, 0)
  }

  /**
   * Starts streaming data from the specified device in Streaming Data Mode.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream = async (duration = 0): Promise<void> => {
    this.resetPacketTracking()
    await this.write("weight", "tx", this.commands.START_WEIGHT_MEAS, duration)
  }

  /**
   * Sets the threshold in Lbs for the Quick Start mode.
   * @param {number} thresholdLbs - The threshold value in pounds.
   * @returns {Promise<void>} A promise that resolves when the threshold is set.
   */
  threshold = async (thresholdLbs: number): Promise<void> => {
    const thresholdHex = thresholdLbs.toString(16).padStart(6, "0")
    // 3-byte array from the hex string
    const bytes = new Uint8Array(3)
    bytes[0] = parseInt(thresholdHex.substring(0, 2), 16)
    bytes[1] = parseInt(thresholdHex.substring(2, 4), 16)
    bytes[2] = parseInt(thresholdHex.substring(4, 6), 16)

    await this.write("forceboard", "threshold", String.fromCharCode(...bytes), 0)
  }

  /**
   * Tares the Force Board device using a characteristic to zero out the current load value.
   * @returns {Promise<void>} A promise that resolves when the tare operation is completed.
   */
  tareByCharacteristic = async (): Promise<void> => {
    // Send tare command (0x01) to the tare characteristic
    const tareValue = String.fromCharCode(0x01)
    await this.write("forceboard", "tare", tareValue, 0)
  }

  /**
   * Initiates a tare routine via the Device Mode characteristic.
   * Writes 0x05 to the Device Mode characteristic to zero out the current load value.
   * @returns {Promise<void>} A promise that resolves when the tare operation is completed.
   */
  tareByMode = async (): Promise<void> => {
    await this.write("weight", "tx", this.commands.TARE_SCALE, 0)
  }

  /**
   * Retrieves temperature information from the device.
   * @returns {Promise<string>} A Promise that resolves with the temperature information,
   */
  temperature = async (): Promise<string | undefined> => {
    return await this.read("temperature", "level", 250)
  }

  /**
   * Starts the Force Board in Quick Start mode.
   * Writes 0x06 to the Device Mode characteristic.
   * @param {number} [duration=0] - The duration in milliseconds. If set to 0, mode will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the operation is completed.
   */
  quick = async (duration = 0): Promise<void> => {
    // Start in Quick Start mode
    await this.write("weight", "tx", this.commands.START_QUICK_MEAS, duration)
  }
}
