/**
 * Array holding current tare values for each channel.
 * @type {number[]}
 */
let tares: number[] = [0, 0, 0]

/**
 * Represents the state of tare calibration.
 * If false, tare calibration is not active.
 * If true, tare calibration process is initiated.
 * If Date object, tare calibration process is ongoing and started at this date.
 * @type {boolean | Date}
 */
let tare: boolean | Date = false

/**
 * Array holding the samples collected during tare calibration.
 * @type {number[][]}
 */
let tareSamples: number[][] = []

/**
 * Array holding the newly calculated tare values.
 * @type {number[]}
 */
let newTares: number[] = []

/**
 * Apply tare calibration to the provided samples.
 * @param {number[]} samples - The samples to calibrate.
 * @param {number} time - The taring process duration time.
 * @returns {Promise<number[]>} A promise that resolves with the calibrated tare values.
 */
export const applyTare = (samples: number[], time: number = 5000): number[] => {
  if (tare) {
    // If taring process is initiated
    if (typeof tare === "boolean" && tare === true) {
      // If tare flag is true (first time), set it to the current date
      tare = new Date()
      // Initialize an array to store new tare values
      newTares = [0, 0, 0]
    }
    // Push current samples to tareSamples array
    tareSamples.push([samples[0], samples[1], samples[2]])
    // Check if taring process duration has passed (defaults to 5 seconds)
    if (typeof tare !== "boolean" && new Date().getTime() - (tare as Date).getTime() > time) {
      // Calculate the average of tare samples for each channel
      for (let i = 0; i < tareSamples.length; ++i) {
        // Subtract the i-th sample value of each channel from newTares
        newTares[0] -= tareSamples[i][0]
        newTares[1] -= tareSamples[i][1]
        newTares[2] -= tareSamples[i][2]
      }
      // Calculate the average for each channel by dividing the sum by the number of samples
      newTares[0] /= tareSamples.length
      newTares[1] /= tareSamples.length
      newTares[2] /= tareSamples.length
      // Update the tare values with the calculated averages
      tares = [...newTares]
      // Reset tare related variables
      tare = false
      tareSamples = []
    }
  }
  return tares
}
