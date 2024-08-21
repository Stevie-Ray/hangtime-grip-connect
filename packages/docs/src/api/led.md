### Supported Devices

```ts
import { Motherboard, KilterBoard } from "./devices"
```

### Basic Usage

```ts
import { connect, led, Motherboard } from "@hangtime/grip-connect"

connect(Progressor, async () => {
    /**
     * Sets the LEDs on the specified device.
     * @param {Device} board - The device on which to set the LEDs.
     * @param {ClimbPlacement[]} [placement] - An optional array of climb placements for LED positioning.
     * @returns {Promise<number[] | undefined>} A promise that resolves with the payload array if LED settings were applied, or `undefined` if no action was taken.
     */
    await led(Motherboard)
})
```