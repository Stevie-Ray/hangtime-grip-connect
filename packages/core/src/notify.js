// Initialize the callback variable
export let notifyCallback;
// Export a function to set the callback
export const notify = (callback) => {
    console.log(callback);
    notifyCallback = callback;
};
