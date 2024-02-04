// Initialize the callback variable
export let notifyCallback;
// Export a cost to set the callback
export const notify = (callback) => {
    notifyCallback = callback;
};
