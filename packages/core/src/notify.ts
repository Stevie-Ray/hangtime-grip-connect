// Define the callback function type
type NotifyCallback = (data: object) => void

// Initialize the callback variable
export let notifyCallback: NotifyCallback

// Export a function to set the callback
export const notify = (callback: NotifyCallback) => {
  notifyCallback = callback
}
