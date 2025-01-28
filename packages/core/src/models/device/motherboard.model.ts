import { Device } from "../device.model.js"
import type { IMotherboard } from "../../interfaces/device/motherboard.interface.js"
import type { DownloadPacket } from "../../interfaces/download.interface.js"

/**
 * Represents a Griptonite Motherboard device.
 * {@link https://griptonite.io}
 */
export class Motherboard extends Device implements IMotherboard {
  /**
   * Length of the packet received from the device.
   * @type {number}
   * @static
   * @readonly
   * @constant
   */
  private static readonly packetLength: number = 32

  /**
   * Number of samples contained in the data packet.
   * @type {number}
   * @static
   * @readonly
   * @constant
   */
  private static readonly samplesNumber: number = 3

  /**
   * Buffer to store received data from the device.
   * @type {number[]}
   * @private
   */
  private receiveBuffer: number[] = []

  /**
   * Calibration data for each sensor of the device.
   * @type {number[][][]}
   * @private
   */
  private calibrationData: number[][][] = [[], [], [], []]

  constructor() {
    super({
      filters: [{ name: "Motherboard" }],
      services: [
        {
          name: "Device Information",
          id: "device",
          uuid: "0000180a-0000-1000-8000-00805f9b34fb",
          characteristics: [
            // {
            //     name: 'Serial Number String (Blocked)',
            //     id: 'serial'
            //     uuid: '00002a25-0000-1000-8000-00805f9b34fb'
            // },
            {
              name: "Firmware Revision String",
              id: "firmware",
              uuid: "00002a26-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Hardware Revision String",
              id: "hardware",
              uuid: "00002a27-0000-1000-8000-00805f9b34fb",
            },
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
          name: "LED Service",
          id: "led",
          uuid: "10ababcd-15e1-28ff-de13-725bea03b127",
          characteristics: [
            {
              name: "Red LED",
              id: "red",
              uuid: "10ab1524-15e1-28ff-de13-725bea03b127",
            },
            {
              name: "Green LED",
              id: "green",
              uuid: "10ab1525-15e1-28ff-de13-725bea03b127",
            },
          ],
        },
        {
          name: "UART Nordic Service",
          id: "uart",
          uuid: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
          characteristics: [
            {
              name: "TX",
              id: "tx",
              uuid: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
            },
            {
              name: "RX",
              id: "rx",
              uuid: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
            },
          ],
        },
      ],
      commands: {
        GET_SERIAL: "#",
        START_WEIGHT_MEAS: "S30",
        STOP_WEIGHT_MEAS: "", // All commands will stop the data stream.
        GET_CALIBRATION: "C",
        SLEEP: 0,
        GET_TEXT: "T",
        DEBUG_STREAM: "D",
      },
    })
  }

  /**
   * Applies calibration to a sample value.
   * @param {number} sample - The sample value to calibrate.
   * @param {number[][]} calibration - The calibration data.
   * @returns {number} The calibrated sample value.
   */
  private applyCalibration = (sample: number, calibration: number[][]): number => {
    // Extract the calibrated value for the zero point
    const zeroCalibration: number = calibration[0][2]
    // Initialize sign as positive
    let sign = 1
    // Initialize the final calibrated value
    let final = 0

    // If the sample value is less than the zero calibration point
    if (sample < zeroCalibration) {
      // Change the sign to negative
      sign = -1
      // Reflect the sample around the zero calibration point
      sample = /* 2 * zeroCalibration */ -sample
    }

    // Iterate through the calibration data
    for (let i = 1; i < calibration.length; i++) {
      // Extract the lower and upper bounds of the current calibration range
      const calibrationStart: number = calibration[i - 1][2]
      const calibrationEnd: number = calibration[i][2]

      // If the sample value is within the current calibration range
      if (sample < calibrationEnd) {
        // Interpolate to get the calibrated value within the range
        final =
          calibration[i - 1][1] +
          ((sample - calibrationStart) / (calibrationEnd - calibrationStart)) *
            (calibration[i][1] - calibration[i - 1][1])
        break
      }
    }
    // Return the calibrated value with the appropriate sign (positive/negative)
    return sign * final
  }

  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  battery = async (): Promise<string | undefined> => {
    return await this.read("battery", "level", 250)
  }

  /**
   * Writes a command to get calibration data from the device.
   * @returns {Promise<void>} A Promise that resolves when the command is successfully sent.
   */
  calibration = async (): Promise<void> => {
    await this.write("uart", "tx", this.commands.GET_CALIBRATION, 2500, (data) => {
      console.log(data)
    })
  }

  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the firmware version,
   */
  firmware = async (): Promise<string | undefined> => {
    return await this.read("device", "firmware", 250)
  }

  /**
   * Handles data received from the Motherboard device. Processes hex-encoded streaming packets
   * to extract samples, calibrate masses, and update running averages of mass data.
   * If the received data is not a valid hex packet, it returns the unprocessed data.
   *
   * @param {BluetoothRemoteGATTCharacteristic} characteristic - The notification event.
   */
  override handleNotifications = (characteristic: BluetoothRemoteGATTCharacteristic): void => {
    const value: DataView | undefined = characteristic.value

    if (value) {
      // Update timestamp
      this.updateTimestamp()
      if (value.buffer) {
        for (let i = 0; i < value.byteLength; i++) {
          this.receiveBuffer.push(value.getUint8(i))
        }

        let idx: number
        while ((idx = this.receiveBuffer.indexOf(10)) >= 0) {
          const line: number[] = this.receiveBuffer.splice(0, idx + 1).slice(0, -1) // Combine and remove LF
          if (line.length > 0 && line[line.length - 1] === 13) line.pop() // Remove CR
          const decoder: TextDecoder = new TextDecoder("utf-8")
          const receivedData: string = decoder.decode(new Uint8Array(line))

          const receivedTime: number = Date.now()

          // Check if the line is entirely hex characters
          const isAllHex: boolean = /^[0-9A-Fa-f]+$/g.test(receivedData)

          // Handle streaming packet
          if (isAllHex && receivedData.length === Motherboard.packetLength) {
            // Base-16 decode the string: convert hex pairs to byte values
            const bytes: number[] = Array.from({ length: receivedData.length / 2 }, (_, i) =>
              Number(`0x${receivedData.substring(i * 2, i * 2 + 2)}`),
            )

            // Translate header into packet, number of samples from the packet length
            const packet: DownloadPacket = {
              received: receivedTime,
              sampleNum: new DataView(new Uint8Array(bytes).buffer).getUint16(0, true),
              battRaw: new DataView(new Uint8Array(bytes).buffer).getUint16(2, true),
              samples: [],
              masses: [],
            }

            const dataView = new DataView(new Uint8Array(bytes).buffer)

            for (let i = 0; i < Motherboard.samplesNumber; i++) {
              const sampleStart: number = 4 + 3 * i
              // Use DataView to read the 24-bit unsigned integer
              const rawValue =
                dataView.getUint8(sampleStart) |
                (dataView.getUint8(sampleStart + 1) << 8) |
                (dataView.getUint8(sampleStart + 2) << 16)

              // Ensure unsigned 32-bit integer
              packet.samples[i] = rawValue >>> 0

              if (packet.samples[i] >= 0x7fffff) {
                packet.samples[i] -= 0x1000000
              }
              packet.masses[i] = this.applyCalibration(packet.samples[i], this.calibrationData[i])
            }
            // invert center and right values
            packet.masses[1] *= -1
            packet.masses[2] *= -1

            // Add data to downloadable Array
            this.downloadPackets.push({
              received: packet.received,
              sampleNum: packet.battRaw,
              battRaw: packet.received,
              samples: [...packet.samples],
              masses: [...packet.masses],
            })

            let left: number = packet.masses[0]
            let center: number = packet.masses[1]
            let right: number = packet.masses[2]

            // Tare correction
            left -= this.applyTare(left)
            center -= this.applyTare(center)
            right -= this.applyTare(right)

            this.massMax = Math.max(Number(this.massMax), Math.max(-1000, left + center + right)).toFixed(1)

            // Update running sum and count
            const currentMassTotal = Math.max(-1000, left + center + right)
            this.massTotalSum += currentMassTotal
            this.dataPointCount++

            // Calculate the average dynamically
            this.massAverage = (this.massTotalSum / this.dataPointCount).toFixed(1)

            // Check if device is being used
            this.activityCheck(center)

            // Notify with weight data
            this.notifyCallback({
              massTotal: Math.max(-1000, left + center + right).toFixed(1),
              massMax: this.massMax,
              massAverage: this.massAverage,
              massLeft: Math.max(-1000, packet.masses[0]).toFixed(1),
              massCenter: Math.max(-1000, packet.masses[1]).toFixed(1),
              massRight: Math.max(-1000, packet.masses[2]).toFixed(1),
            })
          } else if (this.writeLast === this.commands.GET_CALIBRATION) {
            // check data integrity
            if ((receivedData.match(/,/g) || []).length === 3) {
              const parts: string[] = receivedData.split(",")
              const numericParts: number[] = parts.map((x) => parseFloat(x))
              ;(this.calibrationData[numericParts[0]] as number[][]).push(numericParts.slice(1))
            }
          } else {
            // unhandled data
            this.writeCallback(receivedData)
          }
        }
      }
    }
  }

  /**
   * Retrieves hardware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the hardware version,
   */
  hardware = async (): Promise<string | undefined> => {
    return await this.read("device", "hardware", 250)
  }

  /**
   * Sets the LED color based on a single color option. Defaults to turning the LEDs off if no configuration is provided.
   * @param {"green" | "red" | "orange"} [config] - Optional color or array of climb placements for the LEDs. Ignored if placements are provided.
   * @returns {Promise<number[] | undefined>} A promise that resolves with the payload array for the Kilter Board if LED settings were applied, or `undefined` if no action was taken or for the Motherboard.
   */
  led = async (config?: "green" | "red" | "orange"): Promise<number[] | undefined> => {
    if (this.isConnected()) {
      const colorMapping: Record<string, number[][]> = {
        green: [[0x00], [0x01]],
        red: [[0x01], [0x00]],
        orange: [[0x01], [0x01]],
        off: [[0x00], [0x00]],
      }
      // Default to "off" color if config is not set or not found in colorMapping
      const color = typeof config === "string" && colorMapping[config] ? config : "off"
      const [redValue, greenValue] = colorMapping[color]
      await this.write("led", "red", new Uint8Array(redValue))
      await this.write("led", "green", new Uint8Array(greenValue), 1250)
    }
    return undefined
  }

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string>} A Promise that resolves with the manufacturer information,
   */
  manufacturer = async (): Promise<string | undefined> => {
    return await this.read("device", "manufacturer", 250)
  }

  /**
   * Retrieves serial number from the device.
   * @returns {Promise<string>} A Promise that resolves with the serial number,
   */
  serial = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("uart", "tx", this.commands.GET_SERIAL, 250, (data) => {
      response = data
    })
    return response
  }

  /**
   * Stops the data stream on the specified device.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop = async (): Promise<void> => {
    await this.write("uart", "tx", this.commands.STOP_WEIGHT_MEAS, 0)
  }

  /**
   * Starts streaming data from the specified device.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream = async (duration = 0): Promise<void> => {
    // Reset download packets
    this.downloadPackets.length = 0
    // Read calibration data if not already available
    if (!this.calibrationData[0].length) {
      await this.calibration()
    }
    // Start streaming data
    await this.write("uart", "tx", this.commands.START_WEIGHT_MEAS, duration)
    // Stop streaming if duration is set
    if (duration !== 0) {
      await this.stop()
    }
  }

  /**
   * Retrieves the entire 320 bytes of non-volatile memory from the device.
   *
   * The memory consists of 10 segments, each 32 bytes long. If any segment was previously written,
   * the corresponding data will appear in the response. Unused portions of the memory are
   * padded with whitespace.
   *
   * @returns {Promise<string>} A Promise that resolves with the 320-byte memory content as a string,
   */
  text = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("uart", "tx", this.commands.GET_TEXT, 250, (data) => {
      response = data
    })
    return response
  }
}
