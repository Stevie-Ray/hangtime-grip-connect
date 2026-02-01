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

See [Devices](/devices/) and [Guide](/guide) for more.
