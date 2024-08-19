import { notifyCallback } from "./../notify"
import { applyTare } from "./../tare"

// Constants
let MASS_MAX = "0"
let MASS_AVERAGE = "0"
let MASS_TOTAL_SUM = 0
let DATAPOINT_COUNT = 0

/**
 * Handles data received from the Entralpi device.
 * @param {string} receivedData - The received data string.
 */
export const handleEntralpiData = (receivedData: string): void => {
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

  // Notify with weight data
  notifyCallback({
    massMax: MASS_MAX,
    massAverage: MASS_AVERAGE,
    massTotal: Math.max(-1000, numericData).toFixed(1),
  })
}
