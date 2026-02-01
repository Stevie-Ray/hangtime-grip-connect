---
title: Kilter Board
description: "Kilter Board and compatible LED boards: route display"
---

# Kilter Board

The [Kilter Board](https://kilterboardapp.com/) (Aurora Climbing) and compatible LED system boards (Tension,
Grasshopper, Decoy, Touchstone, So iLL) display climb routes via LEDs. The app connects to the board over Bluetooth to
light holds (e.g. green start, cyan middle, magenta finish, yellow feet). Use the `led()` method with an array of hold
positions and role IDs.

## Basic usage

```ts
import { KilterBoard } from "@hangtime/grip-connect"

const device = new KilterBoard()

await device.connect(
  async () => {
    // Set LEDs from route definition: position and role_id per hold
    await device.led([
      { position: 1, role_id: 1 },
      { position: 2, role_id: 2 },
      // ...
    ])
    // Turn off: device.led([]) or device.led()
  },
  (err) => console.error(err),
)
```

## Device-specific methods

In addition to the shared [device interface](/api/device-interface), KilterBoard provides:

| Method        | Returns                          | Description                                                                                           |
| ------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------- |
| `led(config)` | `Promise<number[] \| undefined>` | Set LEDs from an array of `{ position: number; role_id: number }`. Empty array or no arg to turn off. |

## Resources

- [A web based Kilterboard application](https://tim.wants.coffee/posts/kilterboard-app/) (Tim / georift): Blog post on
  building [kilterboard.app](https://kilterboard.app), reverse engineering the Bluetooth protocol, and re-implementing
  with the Web Bluetooth API.
- [Kilterboard](https://www.bazun.me/blog/kiterboard/) (bazun.me): Another resource on building for the Kilter Board.

See [Examples: Kilter Board](/examples/kilter-board) for a full demo and [API Reference](/api/) for the shared
interface.
