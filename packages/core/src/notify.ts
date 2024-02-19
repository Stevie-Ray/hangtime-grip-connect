export interface massObject {
  massTotal: string // The total mass.
  massMax: string // The total maximum mass.
  massLeft?: string // The mass on the left side (optional: Motherboard).
  massCenter?: string // The mass at the center (optional: Motherboard).
  massRight?: string // The mass on the right side (optional: Motherboard).
}
// Define the type for the callback function
type NotifyCallback = (data: massObject) => void
/**
 * Defines the type for the callback function.
 * @callback NotifyCallback
 * @param {massObject} data - The data passed to the callback.
 */
export let notifyCallback: NotifyCallback

/**
 * Sets the callback function to be called when notifications are received.
 * @param {NotifyCallback} callback - The callback function to be set.
 * @returns {void}
 */
export const notify = (callback: NotifyCallback): void => {
  notifyCallback = callback
}
