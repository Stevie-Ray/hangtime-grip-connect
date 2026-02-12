---
title: stop
description: Stops an ongoing force stream.
---

# stop

Device-specific method. Stops a force stream that was started with `stream()`.

## Supported by

- [Motherboard](/devices/motherboard)
- [Progressor](/devices/progressor)
- [ForceBoard](/devices/forceboard)

## Signature

```ts
stop(): Promise<void>
```

## Returns

`Promise<void>` - Resolves when the stream has stopped.

## Example

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()

await device.connect(
  async () => {
    device.notify((data) => console.log(data.current))
    await device.stream() // continuous
    // ... user interaction ...
    await device.stop()
    device.download("csv")
    device.disconnect()
  },
  (err) => console.error(err),
)
```
