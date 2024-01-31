// Initialize the callback variable
export let notifyCallback;
// Export a function to set the callback
export const notify = (callback) => {
    notifyCallback = callback;
};
