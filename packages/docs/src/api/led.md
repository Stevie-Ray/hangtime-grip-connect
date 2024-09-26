### Supported Devices

```ts
import { Motherboard, KilterBoard } from "./devices"
```

### Basic Usage

```ts
import { connect, led, Motherboard } from "@hangtime/grip-connect"

const motherboard = new Motherboard()

motherboard.connect(async () => {
  /**
   * Sets the LEDs on the specified device.
   *
   * - For Kilter Board: Configures the LEDs based on an array of climb placements. If a configuration is provided, it prepares and sends a payload to the device.
   * - For Motherboard: Sets the LED color based on a single color option. Defaults to turning the LEDs off if no configuration is provided.
   *
   * @param {Device} board - The device on which to set the LEDs.
   * @param {"green" | "red" | "orange" | ClimbPlacement[]} [config] - Optional color or array of climb placements for the LEDs. Ignored if placements are provided.
   * @returns {Promise<number[] | undefined>} A promise that resolves with the payload array for the Kilter Board if LED settings were applied, or `undefined` if no action was taken or for the Motherboard.
   */
  await led(Motherboard, "red")
  await led(Motherboard)
})
```
