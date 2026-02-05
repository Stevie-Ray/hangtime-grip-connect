---
title: Entralpi
description: "Entralpi / Lefu / Unique CW275: scale (force plate) with device info"
---

# Entralpi

[Entralpi](https://entralpi.com/) (and compatible devices such as Lefu, Unique CW275) is a scale (force plate). It
exposes device info (battery, firmware, hardware, manufacturer, model, certification, PnP, software, system ID) via read
methods.

## Basic usage

```ts
import { Entralpi } from "@hangtime/grip-connect"

const device = new Entralpi()
device.notify((data) => console.log(data.current))

await device.connect(
  async () => {
    console.log("Battery:", await device.battery())
    console.log("Firmware:", await device.firmware())
    device.disconnect()
  },
  (err) => console.error(err),
)
```

## Methods

Entralpi supports all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify, active,
read, write, download). See [Device interface](/api/device-interface) for details.

### Device-specific

| Method            | Returns                        | Description                                |
| ----------------- | ------------------------------ | ------------------------------------------ |
| `battery()`       | `Promise<string \| undefined>` | Battery/voltage.                           |
| `certification()` | `Promise<string \| undefined>` | IEEE 11073-20601 regulatory certification. |
| `firmware()`      | `Promise<string \| undefined>` | Firmware version.                          |
| `hardware()`      | `Promise<string \| undefined>` | Hardware version.                          |
| `manufacturer()`  | `Promise<string \| undefined>` | Manufacturer info.                         |
| `model()`         | `Promise<string \| undefined>` | Model number.                              |
| `pnp()`           | `Promise<string \| undefined>` | PnP ID.                                    |
| `software()`      | `Promise<string \| undefined>` | Software version.                          |
| `system()`        | `Promise<string \| undefined>` | System ID.                                 |

See [Device interface](/api/device-interface) and [Guide](/guide) for connection and streaming.
