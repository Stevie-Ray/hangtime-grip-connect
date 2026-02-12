---
title: stream
description: Starts force streaming from the device.
---

# stream

Device-specific method. Starts streaming force data from the device. Data is delivered to the callback set with
`notify()`. Use `stop()` to end the stream.

## Supported by

- [Motherboard](/devices/motherboard)
- [Progressor](/devices/progressor)
- [ForceBoard](/devices/forceboard)

## Signature

```ts
stream(duration?: number): Promise<void>
```

## Parameters

| Parameter | Type     | Default | Description                                            |
| --------- | -------- | ------- | ------------------------------------------------------ |
| duration  | `number` | `0`     | Duration in ms. Use `0` or omit for continuous stream. |

## Returns

`Promise<void>` - Resolves when streaming starts (or when `duration` elapses if non-zero).

## Example

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()

await device.connect(
  async () => {
    device.notify((data) => console.log(data.current, data.peak))
    await device.stream(30000) // 30 seconds
    device.download("json")
    device.disconnect()
  },
  (err) => console.error(err),
)

// Continuous stream (call device.stop() to end)
await device.stream()
```
