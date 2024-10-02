import { Device } from "../device.model"
import type { IProgressor } from "../../interfaces/device/progressor.interface"
import { notifyCallback } from "../../notify"
import { applyTare } from "../../tare"
import { checkActivity } from "../../is-active"
import { ProgressorCommands, ProgressorResponses } from "../../commands/progressor"
import struct from "../../struct"
import { DownloadPackets, emptyDownloadPackets } from "../../download"
import { lastWrite, write, writeCallback } from "../../write"

// Constants
let MASS_MAX = "0"
let MASS_AVERAGE = "0"
let MASS_TOTAL_SUM = 0
let DATAPOINT_COUNT = 0

/**
 * Represents a Tindeq Progressor device
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
    })
  }

  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  battery = async (): Promise<string | undefined> => {
    if (this.isConnected()) {
      let response: string | undefined = undefined
      await write(this, "progressor", "tx", ProgressorCommands.GET_BATT_VLTG, 250, (data) => {
        response = data
      })
      return response
    }
    // If device is not found, return undefined
    return undefined
  }

  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the firmware version,
   */
  firmware = async (): Promise<string | undefined> => {
    // Check if the device is connected
    if (this.isConnected()) {
      // Read firmware version from the device
      let response: string | undefined = undefined
      await write(this, "progressor", "tx", ProgressorCommands.GET_FW_VERSION, 250, (data) => {
        response = data
      })
      return response
    }
    // If device is not found, return undefined
    return undefined
  }

  /**
   * Handles data received from the Progressor device, processes weight measurements,
   * and updates mass data including maximum and average values.
   * It also handles command responses for retrieving device information.
   *
   * @param {Event} event - The notification event.
   */
  handleNotifications = (event: Event): void => {
    const characteristic: BluetoothRemoteGATTCharacteristic = event.target as BluetoothRemoteGATTCharacteristic
    const value: DataView | undefined = characteristic.value

    if (value) {
      if (value.buffer) {
        const buffer: ArrayBuffer = value.buffer
        const data: DataView = new DataView(buffer)
        const receivedTime: number = Date.now()
        const [kind] = struct("<bb").unpack(data.buffer.slice(0, 2))
        if (kind === ProgressorResponses.WEIGHT_MEASURE) {
          const iterable: IterableIterator<unknown[]> = struct("<fi").iter_unpack(data.buffer.slice(2))
          // eslint-disable-next-line prefer-const
          for (let [weight, seconds] of iterable) {
            if (typeof weight === "number" && !isNaN(weight) && typeof seconds === "number" && !isNaN(seconds)) {
              // Add data to downloadable Array: sample and mass are the same
              DownloadPackets.push({
                received: receivedTime,
                sampleNum: seconds,
                battRaw: 0,
                samples: [weight],
                masses: [weight],
              })
              // Tare correction
              weight -= applyTare(weight)
              // Check for max weight
              MASS_MAX = Math.max(Number(MASS_MAX), Number(weight)).toFixed(1)
              // Update running sum and count
              const currentMassTotal = Math.max(-1000, Number(weight))
              MASS_TOTAL_SUM += currentMassTotal
              DATAPOINT_COUNT++

              // Calculate the average dynamically
              MASS_AVERAGE = (MASS_TOTAL_SUM / DATAPOINT_COUNT).toFixed(1)

              // Check if device is being used
              checkActivity(weight)

              notifyCallback({
                massMax: MASS_MAX,
                massAverage: MASS_AVERAGE,
                massTotal: Math.max(-1000, weight).toFixed(1),
              })
            }
          }
        } else if (kind === ProgressorResponses.COMMAND_RESPONSE) {
          if (!lastWrite) return

          let value = ""

          if (lastWrite === ProgressorCommands.GET_BATT_VLTG) {
            value = new DataView(data.buffer, 2).getUint32(0, true).toString()
          } else if (lastWrite === ProgressorCommands.GET_FW_VERSION) {
            value = new TextDecoder().decode(data.buffer.slice(2))
          } else if (lastWrite === ProgressorCommands.GET_ERR_INFO) {
            value = new TextDecoder().decode(data.buffer.slice(2))
          }
          writeCallback(value)
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
    if (this.isConnected()) {
      // Stop stream of device
      await write(this, "progressor", "tx", ProgressorCommands.STOP_WEIGHT_MEAS, 0)
    }
  }

  /**
   * Starts streaming data from the specified device.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream = async (duration = 0): Promise<void> => {
    if (this.isConnected()) {
      // Reset download packets
      emptyDownloadPackets()
      // Start streaming data
      await write(this, "progressor", "tx", ProgressorCommands.START_WEIGHT_MEAS, duration)
      // Stop streaming if duration is set
      if (duration !== 0) {
        await this.stop()
      }
    }
  }
}
