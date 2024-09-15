### Supported Devices

```ts
import { Entralpi, Motherboard, Progressor, WHC06 } from "./devices"
```

### Basic Usage

```ts
import { active, isActive, connect, notify, Progressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
  // Listen for stream notifications
  notify((data) => {
    // data: { massTotal: "0", massMax: "0", massAverage: "0", massLeft: "0", massCenter: "0", massRight: "0" }

    // Manually log the current activity status of the device
    console.log(isActive)
  })

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
  active(
    (isActive) => {
      console.log(isActive)
    },
    // Optionally using a weight threshold and duration
    { threshold: 2.5, duration: 1000 },
  )
})
```
