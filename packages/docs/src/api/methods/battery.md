---
title: battery
description: Retrieves battery or voltage information from the device.
---

# battery

Device-specific method. Retrieves battery or voltage information from the connected device.

## Supported by

- [Motherboard](/devices/motherboard)
- [Progressor](/devices/progressor)
- [ForceBoard](/devices/forceboard)
- [Entralpi](/devices/entralpi)
- [Climbro](/devices/climbro)

## Signature

```ts
battery(): Promise<string | undefined>
```

## Returns

`Promise<string | undefined>` - Resolves with battery or voltage information, or `undefined` if unavailable.

## Example

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()

await device.connect(
  async () => {
    const level = await device.battery()
    console.log("Battery:", level)
  },
  (err) => console.error(err),
)
```
