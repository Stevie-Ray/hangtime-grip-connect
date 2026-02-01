---
title: Force Board
description: "PitchSix Force Board Portable: force plate with stream, tare, quick start"
---

# PitchSix Force Board

The [PitchSix Force Board Portable](https://pitchsix.com/products/force-board-portable) is a portable force plate. It
supports battery, humidity/temperature, streaming, tare (by characteristic or mode), Quick Start mode, and threshold
configuration.

## Basic usage

```ts
import { ForceBoard } from "@hangtime/grip-connect"

const device = new ForceBoard()
device.notify((data) => console.log(data.massTotal))

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

## Device-specific methods

| Method                    | Returns                        | Description                                                           |
| ------------------------- | ------------------------------ | --------------------------------------------------------------------- |
| `battery()`               | `Promise<string \| undefined>` | Battery/voltage.                                                      |
| `humidity()`              | `Promise<string \| undefined>` | Humidity level.                                                       |
| `manufacturer()`          | `Promise<string \| undefined>` | Manufacturer info.                                                    |
| `stop()`                  | `Promise<void>`                | Stop stream (Idle mode).                                              |
| `stream(duration?)`       | `Promise<void>`                | Start stream. `duration` in ms; `0` or omit for continuous.           |
| `tareByCharacteristic()`  | `Promise<void>`                | Tare via characteristic.                                              |
| `tareByMode()`            | `Promise<void>`                | Tare via Device Mode (0x05).                                          |
| `threshold(thresholdLbs)` | `Promise<void>`                | Set Quick Start threshold (lbs).                                      |
| `temperature()`           | `Promise<string \| undefined>` | Temperature.                                                          |
| `quick(duration?)`        | `Promise<void>`                | Start Quick Start mode. `duration` in ms; `0` or omit for indefinite. |

See [Device interface](/api/device-interface) for shared `tare(duration?)` and [Guide](/guide) for patterns.

## Official API

PitchSix publishes the Force Board GATT specification for direct integration:
[Force Board Public API v1.0 (PDF)](https://cdn.shopify.com/s/files/1/0249/5525/6922/files/Force_Board_Public_API_1.0.pdf).
It describes Device Mode, Force, Threshold, and Tare characteristics, streaming and Quick Start workflows, and data
packet format.
