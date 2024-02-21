/**
 * Represents the current tare value for calibration.
 * @type {number}
 */
let currentTare: number = 0

/**
 * Represents the state of tare calibration.
 * - If `false`, tare calibration is not active.
 * - If `true`, tare calibration process is initiated.
 * - If `Date` object, tare calibration process is ongoing and started at this date.
 * @type {boolean | Date}
 */
let runTare: boolean | Date = false

/**
 * Array holding the samples collected during tare calibration.
 * @type {number[]}
 */
let tareSamples: number[] = []

/**
 * Array holding the sum of samples collected during tare calibration.
 * @type {number}
 */
let newTares: number = 0

/**
 * Duration time for tare calibration process.
 * @type {number}
 */
let timeTare: number = 5000

/**
 * Initiates the tare calibration process.
 * @param {number} time - The duration time for tare calibration process.
 * @returns {Promise<void>} A Promise that resolves when tare calibration is initiated.
 */
export const tare = async (time: number = 5000): Promise<void> => {
  runTare = true
  timeTare = time
  tareSamples = []
}

/**
 * Apply tare calibration to the provided sample.
 * @param {number} sample - The sample to calibrate.
 * @returns {number} The calibrated tare value.
 */
export const applyTare = (sample: number): number => {
  if (runTare) {
    // If taring process is initiated
    if (typeof runTare === "boolean" && runTare === true) {
      // If tare flag is true (first time), set it to the current date
      runTare = new Date()
      // Initialize the sum of new tare values
      newTares = 0
    }
    // Push current sample to tareSamples array
    tareSamples.push(sample)
    // Check if taring process duration has passed (defaults to 5 seconds)
    if (typeof runTare !== "boolean" && new Date().getTime() - (runTare as Date).getTime() > timeTare) {
      // Calculate the sum of tare samples
      for (let i = 0; i < tareSamples.length; ++i) {
        newTares += tareSamples[i]
      }
      // Calculate the average by dividing the sum by the number of samples and update the tare value with the calculated average
      currentTare = newTares / tareSamples.length
      // Reset tare related variables
      runTare = false
      tareSamples = []
    }
  }
  // Apply tare correction to the sample and return the calibrated value
  return currentTare
}
