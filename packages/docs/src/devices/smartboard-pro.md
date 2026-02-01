---
title: SmartBoard Pro
description: "SmartBoard Pro: force-sensing hangboard"
---

# SmartBoard Pro

[SmartBoard Pro](https://www.smartboard-climbing.com/) is the full package from
[SmartBoard Climbing](https://www.smartboard-climbing.com/): sensors, fingerboard, and app (with optional tablet
bundle). It uses strength sensors for diagnosis tests, personalized exercises, and progress tracking; developed with
French climbing teams and designed for climbers of all levels. Use the shared [device interface](/api/device-interface)
to connect, stream via `notify()`, and export with `download()`.

## Basic usage

```ts
import { SmartBoardPro } from "@hangtime/grip-connect"

const device = new SmartBoardPro()
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

[SmartBoard Climbing](https://www.smartboard-climbing.com/) provides installation guides, calibration guidelines, and
reference scores. See their [useful documents](https://www.smartboard-climbing.com/) section for PDFs.

See [Devices](/devices/) and [Guide](/guide) for more.
