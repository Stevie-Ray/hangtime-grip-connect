---
title: PB-700BT
description: "NSD PB-700BT: Bluetooth gyroscopic hand exerciser"
---

# NSD PB-700BT

The [NSD PB-700BT](https://www.nsd.com.tw/) (also sold as
[NSD Spinner Bluetooth](https://nsd-spinner.shop/en/nsd-spinner-bluetooth.html)) is a Bluetooth gyroscopic hand
exerciser (powerball). BLE, 7.5 cm, rotor-powered; pairs with the NSD Workout app. Use the shared
[device interface](/api/device-interface) to connect and interact with the device.

::: info Availability The Bluetooth model has been discontinued by the manufacturer; app support may vary on newer
devices. :::

## Basic usage

```ts
import { PB700BT } from "@hangtime/grip-connect"

const device = new PB700BT()

await device.connect(
  async () => {
    // Use read/write and notify as needed
    device.disconnect()
  },
  (err) => console.error(err),
)
```

See [Devices](/devices/) and [Guide](/guide) for more.
