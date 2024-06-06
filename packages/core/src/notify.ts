import type { massObject } from "./types/notify"
/** Define the type for the callback function */
export type NotifyCallback = (data: massObject) => void
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
