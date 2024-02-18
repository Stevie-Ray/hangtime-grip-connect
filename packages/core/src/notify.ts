// Define the type for the callback function
type NotifyCallback = (data: object) => void

// Initialize the variable to store the callback function
export let notifyCallback: NotifyCallback

/**
 * Sets the callback function to be called when notifications are received.
 * @param {NotifyCallback} callback - The callback function to be set.
 */
export const notify = (callback: NotifyCallback): void => {
  notifyCallback = callback
}
