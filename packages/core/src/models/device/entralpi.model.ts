import { Device } from "../device.model"
import { notifyCallback } from "../../notify"
import { applyTare } from "../../tare"
import { checkActivity } from "../../is-active"

// Constants
let MASS_MAX = "0"
let MASS_AVERAGE = "0"
let MASS_TOTAL_SUM = 0
let DATAPOINT_COUNT = 0

export class Entralpi extends Device {
  constructor() {
    super({
      filters: [
        {
          name: "ENTRALPI",
        },
      ],
      services: [
        {
          name: "Device Information",
          id: "device",
          uuid: "0000180a-0000-1000-8000-00805f9b34fb",
          characteristics: [],
        },
        {
          name: "Battery Service",
          id: "battery",
          uuid: "0000180f-0000-1000-8000-00805f9b34fb",
          characteristics: [],
        },
        {
          name: "Generic Attribute",
          id: "attribute",
          uuid: "00001801-0000-1000-8000-00805f9b34fb",
          characteristics: [],
        },
        {
          name: "UART ISSC Transparent Service",
          id: "uart",
          uuid: "0000fff0-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "TX",
              id: "tx",
              uuid: "0000fff5-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "RX",
              id: "rx",
              uuid: "0000fff4-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
        {
          name: "Weight Scale",
          id: "weight",
          uuid: "0000181d-0000-1000-8000-00805f9b34fb",
          characteristics: [],
        },
        {
          name: "Generic Access",
          id: "access",
          uuid: "00001800-0000-1000-8000-00805f9b34fb",
          characteristics: [],
        },
      ],
    })
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
        const rawData: DataView = new DataView(buffer)
        const receivedData: string = (rawData.getUint16(0) / 100).toFixed(1)

        let numericData = Number(receivedData)

        // Tare correction
        numericData -= applyTare(numericData)

        // Update MASS_MAX
        MASS_MAX = Math.max(Number(MASS_MAX), numericData).toFixed(1)

        // Update running sum and count
        const currentMassTotal = Math.max(-1000, numericData)
        MASS_TOTAL_SUM += currentMassTotal
        DATAPOINT_COUNT++

        // Calculate the average dynamically
        MASS_AVERAGE = (MASS_TOTAL_SUM / DATAPOINT_COUNT).toFixed(1)

        // Check if device is being used
        checkActivity(numericData)

        // Notify with weight data
        notifyCallback({
          massMax: MASS_MAX,
          massAverage: MASS_AVERAGE,
          massTotal: Math.max(-1000, numericData).toFixed(1),
        })
      }
    }
  }
}
