---
title: led
description: Sets LED color or route display. Signature varies by device.
---

# led

Device-specific method. Sets LED color or route display. The signature differs between Motherboard and Aurora LED
boards.

## Supported by

- [Motherboard](/devices/motherboard) - simple color
- [Aurora LED boards](/devices/aurora) - array of placements

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

## Aurora LED Boards

Configures LEDs based on an array of climb placements. Each placement needs `position` and either `role_id` or `color`.
The Aurora API level is detected from the connected Bluetooth device name. Names ending in `@2` use API level 2, names
ending in `@3` use API level 3, and names without an API suffix use API level 2. Use the board-specific class
(`KilterBoard`, `TensionBoard`, `DecoyBoard`, `TouchstoneBoard`, or `GrasshopperBoard`) for that board's built-in
`role_id` map. Use `Aurora` for a generic 1/2/3/4 role map, or pass `color` directly.

```ts
led(config?: { position: number; role_id?: number; color?: string }[]): Promise<number[] | undefined>
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
      { position: 1, role_id: 12 },
    ])
  },
  (err) => console.error(err),
)
```
