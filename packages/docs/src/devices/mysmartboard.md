---
title: mySmartBoard
description: "mySmartBoard: force-sensing hangboard"
---

# mySmartBoard

[mySmartBoard](https://www.smartboard-climbing.com/) is a sensor interface from
[SmartBoard Climbing](https://www.smartboard-climbing.com/) that you mount on your own hangboard. It uses strength
sensors to stream force data for testing and quantifying training. Compatible with Beastmaker 1000/2000 series and YY
Verticalboard One/Evo; the official app supports Android and iOS (up to 4 user accounts). Use the shared
[device interface](/api/device-interface) to connect, stream via `notify()`, and export with `download()`.

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

## Official site

[SmartBoard Climbing](https://www.smartboard-climbing.com/) provides installation advice, calibration guidelines, and
reference scores. See their [useful documents](https://www.smartboard-climbing.com/) section for PDFs.

See [Devices](/devices/) and [Guide](/guide) for more.
