### Basic Usage

```ts
import { KilterBoard } from "@hangtime/grip-connect"

const device = new KilterBoard()
```

### Device features

See [Devices](/devices/) for default device features.

```ts
/**
 * Configures the LEDs based on an array of climb placements.
 * @param {{ position: number; role_id: number }[]} config - Array of climb placements for the LEDs.
 * @returns {Promise<number[] | undefined>} A promise that resolves with the payload array for the Kilter Board if LED settings were applied, or `undefined` if no action was taken or for the Motherboard.
 */
led(config: { position: number; role_id: number }[]): Promise<number[] | undefined>
```
