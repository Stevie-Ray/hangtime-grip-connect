import { Device } from "../device.model.js"
import type { ISmartBoardPro } from "../../interfaces/device/smartboard-pro.interface.js"

/**
 * Represents a Smartboard Climbing SmartBoard Pro device.
 * TODO: Figure out services, do you own a SmartBoard Pro? Help us!
 * {@link https://www.smartboard-climbing.com}
 */
export class SmartBoardPro extends Device implements ISmartBoardPro {
  constructor() {
    super({
      filters: [{ name: "SMARTBOARD" }],
      services: [
        {
          name: "Weight Scale Service",
          id: "weight",
          uuid: "00001851-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "",
              id: "",
              uuid: "0000937d-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
        {
          name: "Smartboard Service",
          id: "smartboard",
          uuid: "0000403d-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "SmartBoard Measurement",
              id: "rx",
              uuid: "00001583-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
        {
          name: "Generic Attribute",
          id: "attribute",
          uuid: "00001801-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Service Changed",
              id: "service",
              uuid: "00002a05-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
      ],
    })
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
      // Update timestamp
      this.updateTimestamp()
      if (value.buffer) {
        const length = value.byteLength / 2
        const dataArray: number[] = []

        for (let i = 0; i < length; i++) {
          const offset = i * 2
          if (offset + 1 < value.byteLength) {
            const intValue = value.getInt16(offset, true)
            // For debugging purposes
            console.log(intValue)

            dataArray.push(intValue)
          }
        }

        if (dataArray.length === 0) return

        const receivedTime = Date.now()

        // Process each data point
        for (const receivedData of dataArray) {
          // Skip invalid values
          if (!Number.isFinite(receivedData)) continue

          const numericData = receivedData - this.applyTare(receivedData)

          // Add data to downloadable Array
          this.downloadPackets.push({
            received: receivedTime,
            sampleNum: this.dataPointCount,
            battRaw: 0,
            samples: [numericData],
            masses: [numericData],
          })

          // Update peak
          this.peak = Math.max(this.peak, numericData)

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
