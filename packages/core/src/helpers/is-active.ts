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
 * Configuration for threshold and duration.
 */
let config = { threshold: 2.5, duration: 1000 }

/**
 * Sets the callback function to be called when the activity status changes,
 * and optionally sets the configuration for threshold and duration.
 *
 * This function allows you to specify a callback that will be invoked whenever
 * the activity status changes, indicating whether the device is currently active.
 * It also allows optionally configuring the threshold and duration used to determine activity.
 *
 * @param {IsActiveCallback} callback - The callback function to be set. This function
 *                                      receives a boolean value indicating the new activity status.
 * @param {object} [options] - Optional configuration object containing the threshold and duration.
 * @param {number} [options.threshold=2.5] - The threshold value for determining activity.
 * @param {number} [options.duration=1000] - The duration (in milliseconds) to monitor the input for activity.
 * @returns {void}
 */
export const active = (callback: IsActiveCallback, options?: { threshold?: number; duration?: number }): void => {
  activeCallback = callback

  // Update the config values only if provided, otherwise use defaults
  config = {
    threshold: options?.threshold ?? config.threshold, // Use new threshold if provided, else use default
    duration: options?.duration ?? config.duration, // Use new duration if provided, else use default
  }
}

/**
 * Checks if a dynamic value is active based on a threshold and duration.
 *
 * This function assesses whether a given dynamic value surpasses a specified threshold
 * and remains active for a specified duration. If the activity status changes from
 * the previous state, the callback function is called with the updated activity status.
 *
 * @param {number} input - The dynamic value to check for activity status.
 * @returns {Promise<void>} A promise that resolves once the activity check is complete.
 */
export const checkActivity = (input: number): Promise<void> => {
  return new Promise((resolve) => {
    // Check the activity status after the specified duration
    setTimeout(() => {
      // Determine the activity status based on the stored threshold in the config
      const activeNow = input > config.threshold
      if (isActive !== activeNow) {
        isActive = activeNow
        if (activeCallback) {
          activeCallback(activeNow)
        }
      }
      resolve()
    }, config.duration)
  })
}
