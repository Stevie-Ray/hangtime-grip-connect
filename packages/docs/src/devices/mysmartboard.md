---
title: mySmartBoard
description: "mySmartBoard: force-sensing hangboard"
---

# mySmartBoard

[mySmartBoard](https://www.smartboard-climbing.com/) is a sensor interface from
[SmartBoard Climbing](https://www.smartboard-climbing.com/) that you mount on your hangboard. Compatible with Beastmaker
1000/2000 and YY Verticalboard One/Evo. Use the shared [device interface](/api/device-interface) to connect and stream
via `notify()`.

## Basic usage

```ts
import { mySmartBoard } from "@hangtime/grip-connect"

const device = new mySmartBoard()
device.notify((data) => console.log(data.massTotal))

await device.connect(
  async () => {
    await device.stream(30000)
    device.disconnect()
  },
  (err) => console.error(err),
)
```

## Methods

mySmartBoard supports all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify, active,
read, write, download). See [Device interface](/api/device-interface) for details.

### Device-specific

| Method              | Returns         | Description                                                       |
| ------------------- | --------------- | ----------------------------------------------------------------- |
| `stop()`            | `Promise<void>` | Stop an ongoing stream.                                           |
| `stream(duration?)` | `Promise<void>` | Start force stream. `duration` in ms; `0` or omit for continuous. |

See [Devices](/devices/) and [Guide](/guide) for more.
