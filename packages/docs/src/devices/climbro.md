---
title: Climbro
description:
  "Climbro: science-backed force-sensing hangboard with Performance Test Battery and personalized training plans"
---

# Climbro

[Climbro](https://climbro.com/) is a force-sensing hangboard with integrated sensors and Bluetooth to the Climbro app
for real-time feedback and training plans. Use the shared [device interface](/api/device-interface) to connect, stream
force data via `notify()`, and export with `download()`.

## Basic usage

```ts
import { Climbro } from "@hangtime/grip-connect"

const device = new Climbro()
device.notify((data) => console.log(data.massTotal, data.massMax))

await device.connect(
  async () => {
    await device.stream(30000)
    device.download("json")
    device.disconnect()
  },
  (err) => console.error(err),
)
```

## Methods

Climbro supports all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify, active, read,
write, download). See [Device interface](/api/device-interface) for details.

### Device-specific

| Method              | Returns                        | Description                                                       |
| ------------------- | ------------------------------ | ----------------------------------------------------------------- |
| `battery()`         | `Promise<string \| undefined>` | Battery level (updated via notifications).                        |
| `stop()`            | `Promise<void>`                | Stop an ongoing stream.                                           |
| `stream(duration?)` | `Promise<void>`                | Start force stream. `duration` in ms; `0` or omit for continuous. |

See [Devices](/devices/) and [Guide](/guide) for more.
