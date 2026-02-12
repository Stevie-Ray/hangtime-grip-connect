---
title: led
description: Sets LED color or route display. Signature varies by device.
---

# led

Device-specific method. Sets LED color or route display. The signature differs between Motherboard and Kilter Board.

## Supported by

- [Motherboard](/devices/motherboard) - simple color
- [Kilter Board](/devices/kilterboard) - array of placements

---

## Motherboard

Sets LED color. Omit `config` to turn LEDs off.

```ts
led(config?: "green" | "red" | "orange"): Promise<number[] | undefined>
```

### Example

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()

await device.connect(
  async () => {
    await device.led("green")
    await device.stream()
    // Later: device.led() to turn off
  },
  (err) => console.error(err),
)
```

---

## Kilter Board

Configures LEDs based on an array of climb placements. Each placement needs `position` and either `role_id` or `color`.

```ts
led(config: { position: number; role_id?: number; color?: string }[]): Promise<number[] | undefined>
```

| Property | Type     | Description                                 |
| -------- | -------- | ------------------------------------------- |
| position | `number` | LED position on the board.                  |
| role_id  | `number` | Optional role identifier for the placement. |
| color    | `string` | Optional hex color (e.g. `"#ff0000"`).      |

### Example

```ts
import { KilterBoard } from "@hangtime/grip-connect"

const device = new KilterBoard()

await device.connect(
  async () => {
    await device.led([
      { position: 0, color: "#ff0000" },
      { position: 1, role_id: 1 },
    ])
  },
  (err) => console.error(err),
)
```
