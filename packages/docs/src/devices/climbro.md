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

Force data streams automatically via BLE notifications once connected. Set `notify()` before connecting to receive data;
no explicit `stream()` call is needed.

```ts
import { Climbro } from "@hangtime/grip-connect"

const device = new Climbro()
device.notify((data) => console.log(data.current, data.peak))

await device.connect(
  async () => {
    await new Promise((r) => setTimeout(r, 30000)) // session duration
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

| Method           | Returns                        | Description                                  |
| ---------------- | ------------------------------ | -------------------------------------------- |
| `battery()`      | `Promise<string \| undefined>` | Battery level (updated via notifications).   |
| `hardware()`     | `Promise<string \| undefined>` | Hardware revision from Device Information.   |
| `manufacturer()` | `Promise<string \| undefined>` | Manufacturer name from Device Information.   |
| `model()`        | `Promise<string \| undefined>` | Model number string from Device Information. |
| `software()`     | `Promise<string \| undefined>` | Software revision from Device Information.   |
| `system()`       | `Promise<string \| undefined>` | System ID from Device Information.           |

See [Devices](/devices/) and [Guide](/guide) for more.
