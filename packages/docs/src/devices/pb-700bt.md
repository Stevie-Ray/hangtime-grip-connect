---
title: PB-700BT
description: "NSD PB-700BT: Bluetooth gyroscopic hand exerciser"
---

# NSD PB-700BT

The [NSD PB-700BT](https://www.nsd.com.tw/) (also sold as
[NSD Spinner Bluetooth](https://nsd-spinner.shop/en/nsd-spinner-bluetooth.html)) is a Bluetooth gyroscopic hand
exerciser (powerball). BLE, 7.5 cm, rotor-powered; pairs with the NSD Workout app. Use the shared
[device interface](/api/device-interface) to connect and interact with the device.

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

## Methods

PB-700BT supports all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify, active,
read, write, download). See [Device interface](/api/device-interface) for details. No device-specific methods beyond the
shared interface; use `read()`, `write()`, and `notify()` as needed for the gyroscopic exerciser protocol.

See [Devices](/devices/) and [Guide](/guide) for more.
