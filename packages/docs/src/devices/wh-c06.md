---
title: WH-C06
description: "Weiheng WH-C06: Bluetooth hanging scale, used by climbers as a cheap alternative to Tindeq / Force Board"
---

# Weiheng WH-C06

The [Weiheng WH-C06](https://weihengmanufacturer.com/products/wh-c06-bluetooth-300kg-hanging-scale/) is a Bluetooth
hanging scale sold as hand scales for farm weighing (300 kg capacity). Climbers use it as a low-cost alternative to
devices like the Tindeq Progressor and PitchSix Force Board for force measurement and hangboard training. Use the shared
[device interface](/api/device-interface) to connect and read force data.

::: tip Discovery On some browsers the WH-C06 may require Chrome’s **watchAdvertisements**. See
[Browser support: WH-C06](/browser-support#wh-c06-and-advertisement-scanning). :::

## Basic usage

```ts
import { WHC06 } from "@hangtime/grip-connect"

const device = new WHC06()
device.notify((data) => console.log(data.massTotal))

await device.connect(
  async () => {
    await device.stream(30000)
    device.disconnect()
  },
  (err) => console.error(err),
)
```

See [Devices](/devices/) and [Guide](/guide) for more.
