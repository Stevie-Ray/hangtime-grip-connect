/**
 * Type definition for the callback function that is called when the activity status changes.
 * @param {boolean} value - The new activity status (true if active, false if not).
 */
type IsActiveCallback = (value: boolean) => void

let activeCallback: IsActiveCallback | undefined

/**
 * Indicates whether the device is currently active.
 * @type {boolean}
 */
export let isActive = false

/**
 * Sets the callback function to be called when the activity status changes.
 *
 * This function allows you to specify a callback that will be invoked whenever
 * the activity status changes, indicating whether the device is currently active.
 *
 * @param {IsActiveCallback} callback - The callback function to be set. This function
 *                                      receives a boolean value indicating the new activity status.
 * @returns {void}
 */
export const active = (callback: IsActiveCallback): void => {
  activeCallback = callback
}

/**
 * Checks if a dynamic value is active based on a threshold and duration.
 *
 * This function assesses whether a given dynamic value surpasses a specified threshold
 * and remains active for a specified duration. If the activity status changes from
 * the previous state, the callback function is called with the updated activity status.
 *
 * @param {number} input - The dynamic value to check for activity status.
 * @param {number} [threshold=2.5] - The threshold value to determine if the input is considered active.
 *                                    Defaults to 2.5 if not provided.
 * @param {number} [duration=1000] - The duration (in milliseconds) to monitor the input for activity.
 *                                    Defaults to 1000 milliseconds if not provided.
 * @returns {Promise<void>} A promise that resolves once the activity check is complete.
 */
export const checkActivity = (input: number, threshold = 2.5, duration = 1000): Promise<void> => {
  return new Promise((resolve) => {
    // Check the activity status after the specified duration
    setTimeout(() => {
      // Determine the activity status based on the threshold
      const activeNow = input > threshold
      if (isActive !== activeNow) {
        isActive = activeNow
        if (activeCallback) {
          activeCallback(activeNow)
        }
      }
      resolve()
    }, duration)
  })
}
