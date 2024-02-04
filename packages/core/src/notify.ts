// Define the callbacks type
type NotifyCallback = (data: object) => void

// Initialize the callback variable
export let notifyCallback: NotifyCallback

// Export a cost to set the callback
export const notify = (callback: NotifyCallback) => {
  notifyCallback = callback
}
