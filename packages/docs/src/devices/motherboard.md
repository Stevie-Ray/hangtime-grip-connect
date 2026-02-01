---
title: Motherboard
description: "Griptonite Motherboard: hangboard with LED and force streaming"
---

# Griptonite Motherboard

The [Griptonite Motherboard](https://griptonite.io/shop/motherboard/) is a force-sensing hangboard with configurable
LEDs (green, red, orange) and real-time force streaming. It supports battery, firmware/hardware info, calibration, and
session export.

## Basic usage

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()
device.notify((data) => console.log(data.massTotal, data.massMax))

await device.connect(
  async () => {
    console.log("Battery:", await device.battery())
    await device.stream(30000)
    device.download("json")
    device.disconnect()
  },
  (err) => console.error(err),
)
```

## Methods

Motherboard supports all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify, active,
read, write, tare, download). See [Device interface](/api/device-interface) for details.

### Device-specific

| Method              | Returns                          | Description                                                                                                          |
| ------------------- | -------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| `battery()`         | `Promise<string \| undefined>`   | Battery or voltage information.                                                                                      |
| `calibration()`     | `Promise<void>`                  | Request calibration data from the device.                                                                            |
| `firmware()`        | `Promise<string \| undefined>`   | Firmware version.                                                                                                    |
| `hardware()`        | `Promise<string \| undefined>`   | Hardware version.                                                                                                    |
| `led(config?)`      | `Promise<number[] \| undefined>` | Set LED color. `"green"` \| `"red"` \| `"orange"`; omit to turn off. Returns payload for Kilter Board compatibility. |
| `manufacturer()`    | `Promise<string \| undefined>`   | Manufacturer info.                                                                                                   |
| `serial()`          | `Promise<string \| undefined>`   | Serial number.                                                                                                       |
| `stop()`            | `Promise<void>`                  | Stop an ongoing stream.                                                                                              |
| `stream(duration?)` | `Promise<void>`                  | Start force stream. `duration` in ms; `0` or omit for continuous.                                                    |

## Example with LED

```ts
await device.connect(
  async () => {
    await device.led("green") // optional: set LED color
    await device.stream(0) // stream until stop()
    device.notify((data) => console.log(data))
    // later: device.stop(); device.disconnect()
  },
  (err) => console.error(err),
)
```

See [Guide](/guide) and [API](/api/) for more.
