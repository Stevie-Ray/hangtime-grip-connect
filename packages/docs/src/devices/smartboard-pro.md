---
title: SmartBoard Pro
description: "SmartBoard Pro: force-sensing hangboard"
---

# SmartBoard Pro

[SmartBoard Pro](https://www.smartboard-climbing.com/) is the full package from
[SmartBoard Climbing](https://www.smartboard-climbing.com/): sensors, fingerboard, and app (with optional tablet
bundle). Developed with French climbing teams and designed for climbers of all levels. Use the shared
[device interface](/api/device-interface) to connect, stream via `notify()`, and export with `download()`.

## Basic usage

```ts
import { SmartBoardPro } from "@hangtime/grip-connect"

const device = new SmartBoardPro()
device.notify((data) => console.log(data.current))

await device.connect(
  async () => {
    await device.stream(30000)
    device.disconnect()
  },
  (err) => console.error(err),
)
```

## Methods

SmartBoard Pro supports all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify,
active, read, write, download). See [Device interface](/api/device-interface) for details.

### Device-specific

| Method              | Returns         | Description                                                       |
| ------------------- | --------------- | ----------------------------------------------------------------- |
| `stop()`            | `Promise<void>` | Stop an ongoing stream.                                           |
| `stream(duration?)` | `Promise<void>` | Start force stream. `duration` in ms; `0` or omit for continuous. |

See [Devices](/devices/) and [Guide](/guide) for more.
