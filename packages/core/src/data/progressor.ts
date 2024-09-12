import { notifyCallback } from "./../notify"
import { applyTare } from "./../tare"
import { checkActivity } from "./../is-active"
import { ProgressorCommands, ProgressorResponses } from "./../commands/progressor"
import { lastWrite, writeCallback } from "./../write"
import struct from "./../struct"
import { DownloadPackets } from "./../download"

// Constants
let MASS_MAX = "0"
let MASS_AVERAGE = "0"
let MASS_TOTAL_SUM = 0
let DATAPOINT_COUNT = 0

/**
 * Handles data received from the Progressor device, processes weight measurements,
 * and updates mass data including maximum and average values.
 * It also handles command responses for retrieving device information.
 *
 * @param {DataView} data - The raw binary data received from the Progressor device.
 * @returns {void}
 */
export const handleProgressorData = (data: DataView): void => {
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
