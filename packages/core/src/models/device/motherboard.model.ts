import { Device } from "../device.model"
import type { IMotherboard } from "../../interfaces/device/motherboard.interface"
import { notifyCallback } from "../../notify"
import { writeCallback } from "../../write"
import { applyTare } from "../../tare"
import { MotherboardCommands } from "../../commands"
import { checkActivity } from "../../is-active"
import { lastWrite } from "../../write"
import { DownloadPackets } from "../../download"
import type { DownloadPacket } from "../../types/download"

// Constants
const PACKET_LENGTH = 32
const NUM_SAMPLES = 3
let MASS_MAX = "0"
let MASS_AVERAGE = "0"
let MASS_TOTAL_SUM = 0
let DATAPOINT_COUNT = 0

const receiveBuffer: number[] = []

export const CALIBRATION = [[], [], [], []]

/**
 * Represents a Griptonite Motherboard device
 */
export class Motherboard extends Device implements IMotherboard {
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
    })
  }

  /**
   * Applies calibration to a sample value.
   * @param {number} sample - The sample value to calibrate.
   * @param {number[][]} calibration - The calibration data.
   * @returns {number} The calibrated sample value.
   */
  applyCalibration = (sample: number, calibration: number[][]): number => {
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
   * Handles data received from the Motherboard device. Processes hex-encoded streaming packets
   * to extract samples, calibrate masses, and update running averages of mass data.
   * If the received data is not a valid hex packet, it returns the unprocessed data.
   *
   * @param {Event} event - The notification event.
   */
  handleNotifications = (event: Event): void => {
    const characteristic: BluetoothRemoteGATTCharacteristic = event.target as BluetoothRemoteGATTCharacteristic
    const value: DataView | undefined = characteristic.value

    if (value) {
      if (value.buffer) {
        for (let i = 0; i < value.byteLength; i++) {
          receiveBuffer.push(value.getUint8(i))
        }

        let idx: number
        while ((idx = receiveBuffer.indexOf(10)) >= 0) {
          const line: number[] = receiveBuffer.splice(0, idx + 1).slice(0, -1) // Combine and remove LF
          if (line.length > 0 && line[line.length - 1] === 13) line.pop() // Remove CR
          const decoder: TextDecoder = new TextDecoder("utf-8")
          const receivedData: string = decoder.decode(new Uint8Array(line))

          const receivedTime: number = Date.now()

          // Check if the line is entirely hex characters
          const isAllHex: boolean = /^[0-9A-Fa-f]+$/g.test(receivedData)

          // Handle streaming packet
          if (isAllHex && receivedData.length === PACKET_LENGTH) {
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

            for (let i = 0; i < NUM_SAMPLES; i++) {
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
              packet.masses[i] = this.applyCalibration(packet.samples[i], CALIBRATION[i])
            }
            // invert center and right values
            packet.masses[1] *= -1
            packet.masses[2] *= -1

            // Add data to downloadable Array
            DownloadPackets.push({
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
            left -= applyTare(left)
            center -= applyTare(center)
            right -= applyTare(right)

            MASS_MAX = Math.max(Number(MASS_MAX), Math.max(-1000, left + center + right)).toFixed(1)

            // Update running sum and count
            const currentMassTotal = Math.max(-1000, left + center + right)
            MASS_TOTAL_SUM += currentMassTotal
            DATAPOINT_COUNT++

            // Calculate the average dynamically
            MASS_AVERAGE = (MASS_TOTAL_SUM / DATAPOINT_COUNT).toFixed(1)

            // Check if device is being used
            checkActivity(center)

            // Notify with weight data
            notifyCallback({
              massTotal: Math.max(-1000, left + center + right).toFixed(1),
              massMax: MASS_MAX,
              massAverage: MASS_AVERAGE,
              massLeft: Math.max(-1000, packet.masses[0]).toFixed(1),
              massCenter: Math.max(-1000, packet.masses[1]).toFixed(1),
              massRight: Math.max(-1000, packet.masses[2]).toFixed(1),
            })
          } else if (lastWrite === MotherboardCommands.GET_CALIBRATION) {
            // check data integrity
            if ((receivedData.match(/,/g) || []).length === 3) {
              const parts: string[] = receivedData.split(",")
              const numericParts: number[] = parts.map((x) => parseFloat(x))
              ;(CALIBRATION[numericParts[0]] as number[][]).push(numericParts.slice(1))
            }
          } else {
            // unhandled data
            writeCallback(receivedData)
          }
        }
      }
    }
  }
}
