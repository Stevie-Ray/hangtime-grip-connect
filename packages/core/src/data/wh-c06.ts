import { notifyCallback } from "./../notify"
import { applyTare } from "./../tare"

// Constants
let MASS_MAX = "0"
let MASS_AVERAGE = "0"
let MASS_TOTAL_SUM = 0
let DATAPOINT_COUNT = 0
const WEIGHT_OFFSET = 10
// const STABLE_OFFSET = 14

/**
 * Handles data received from the WH-C06 device.
 * @param {DataView} data - The received data.
 */
export const handleWHC06Data = (data: DataView): void => {
  const weight = (data.getUint8(WEIGHT_OFFSET) << 8) | data.getUint8(WEIGHT_OFFSET + 1)
  // const stable = (data.getUint8(STABLE_OFFSET) & 0xf0) >> 4
  // const unit = data.getUint8(STABLE_OFFSET) & 0x0f

  let numericData = weight / 100

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

  // Notify with weight data
  notifyCallback({
    massMax: MASS_MAX,
    massAverage: MASS_AVERAGE,
    massTotal: Math.max(-1000, numericData).toFixed(1),
  })
}
