---
title: Progressor
description: "Tindeq Progressor: Bluetooth dynamometer for finger strength, validated for climbing assessment"
---

# Tindeq Progressor

The [Tindeq Progressor](https://tindeq.com/product/progressor/) is a Bluetooth dynamometer for measuring finger and
pulling strength. It connects to the Tindeq app and works with any hangboard or lifting edge; climbers use it for
testing, training, and rehab. Use the shared [device interface](/api/device-interface) to connect, stream force data via
`notify()`, and export with `download()`.

## Basic usage

```ts
import { Progressor } from "@hangtime/grip-connect"

const device = new Progressor()
device.notify((data) => console.log(data.current, data.peak))

await device.connect(
  async () => {
    console.log("Battery:", await device.battery())
    console.log("Firmware:", await device.firmware())
    device.tare(5000) // optional: tare before stream
    await device.stream(30000)
    device.download("json")
    device.disconnect()
  },
  (err) => console.error(err),
)
```

## Methods

Progressor supports all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify, active,
read, write, tare, download). See [Device interface](/api/device-interface) for details.

### Device-specific

| Method                    | Returns                        | Description                                                                     |
| ------------------------- | ------------------------------ | ------------------------------------------------------------------------------- |
| `battery()`               | `Promise<string \| undefined>` | Battery/voltage information.                                                    |
| `firmware()`              | `Promise<string \| undefined>` | Firmware version.                                                               |
| `saveCalibration()`       | `Promise<void>`                | Save calibration after both points (opcode 0x6A).                               |
| `addCalibrationPoint(kg)` | `Promise<void>`                | Add calibration point: 0 for zero, or known kg (opcode 0x69 + 4-byte float LE). |
| `stop()`                  | `Promise<void>`                | Stop an ongoing stream.                                                         |
| `stream(duration?)`       | `Promise<void>`                | Start force stream. `duration` in ms; `0` or omit for continuous.               |
| `tareScale()`             | `Promise<void>`                | Send device tare command to zero the scale (hardware tare).                     |

Progressor also supports `tare(duration?)` from the base interface for software tare (average over duration).

### Performance metadata

Progressor includes [performance metadata](/api/data-types#forcemeasurement) on every `notify()` payload like all
streaming devices. For Progressor, `performance.samplingRateHz` is computed from **device timestamps**: number of
samples in the last 1 second of device time (same as Crimpdeq `currentHz`). Payload length / 8 gives
`performance.samplesPerPacket`. Notify interval and packet index match Crimpdeq's `_handleWeightMeasurement` logic.

## Compatible hardware

**[Crimpdeq](https://github.com/crimpdeq)** is open-source portable hardware inspired by the Tindeq Progressor and
designed for climbers, coaches, and therapists. It uses the Tindeq Progressor API (BLE), so it is compatible with Grip
Connect’s `Progressor` class. The project includes firmware (Rust), PCB design, and a
[book](https://crimpdeq.github.io/book/) for assembly and calibration.

**[Mito](https://github.com/jvasilakes/mito)** is a small, open-source force gauge for isometric finger strength
training. It advertises as a Progressor and works with the Frez and Tindeq apps, so it is compatible with the
`Progressor` class. Built on a Seeed XIAO nRF52840, HX711 ADC, and custom load cell; firmware and hardware are open.

**[Hangman](https://github.com/kesyog/hangman)** is an open-source Bluetooth-enabled crane-scale retrofit for climbing
training and rehabilitation. It replaces the internal electronics of a low-cost 150 kg crane scale with a custom
nRF52-based PCB and differential ADC, running Rust firmware built on Embassy and Nordic’s SoftDevice, and can integrate
with Progressor-compatible software.

## Official API

Tindeq publishes the Progressor Bluetooth interface for custom applications:
[Tindeq Progressor API](https://tindeq.com/progressor_api/). It describes the custom Progressor service, control point
(TLV commands), data point (notifications), and includes notes on auto-shutdown and data format. Useful for low-level
integration or verification with tools like nRF Connect.

Tindeq’s example client ([progressor_client.py](https://tindeq.com/progressor_api/)) uses the same opcodes: single-byte
commands 100–111 (e.g. 100 = tare scale, 101 = start weight meas, 105 = add calibration point, 106 = save calibration,
107 = get app/firmware version, 111 = get battery voltage).

See [Guide](/guide) and [API](/api/) for more.
