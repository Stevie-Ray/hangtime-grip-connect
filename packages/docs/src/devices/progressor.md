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
    await device.stream() // Start stream first (tare requires active stream)
    device.tare() // Tare while streaming
    await device.stop()
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

| Method                  | Returns                        | Description                                                       |
| ----------------------- | ------------------------------ | ----------------------------------------------------------------- |
| `battery()`             | `Promise<string \| undefined>` | Battery/voltage information.                                      |
| `firmware()`            | `Promise<string \| undefined>` | Firmware version.                                                 |
| `calibration()`         | `Promise<string \| undefined>` | Read current calibration curve.                                   |
| `addCalibrationPoint()` | `Promise<void>`                | Capture current ADC reading as calibration point.                 |
| `saveCalibration()`     | `Promise<void>`                | Compute curve from stored points and save to flash.               |
| `setCalibration(curve)` | `Promise<void>`                | Raw overwrite: write 12-byte curve directly. Expert only.         |
| `stop()`                | `Promise<void>`                | Stop an ongoing stream.                                           |
| `stream(duration?)`     | `Promise<void>`                | Start force stream. `duration` in ms; `0` or omit for continuous. |

`tare(duration?)` from the shared interface uses **hardware tare**: it sends the device command to zero the scale. The
device must be **streaming** when you call tare—the hardware captures the current weight reading during the stream. The
`duration` parameter is accepted for API compatibility but ignored (hardware tare is instant).

### Calibration

Calibration is done by capturing calibration points (the device’s current ADC reading at known loads), then calling
`saveCalibration()` to compute the curve and write it to flash. The standard flow uses two points: zero load and a known
reference weight.

#### Add a Calibration point

1. **Add zero point**: With no load on the device, call `addCalibrationPoint()`. The device captures the current ADC
   reading.
2. **Add reference point**: Place a known weight (e.g. 5 kg) on the device and call `addCalibrationPoint()` again.
3. **Save**: Call `saveCalibration()` to compute the curve from the stored points and persist it to flash.

The device needs a stable load for each capture.

#### Reading the calibration curve

`calibration()` returns the current 12-byte curve as a hex string together with a decoded representation of the three
32-bit little-endian values stored in the curve. Use it to inspect settings or back up a curve before overwriting.

#### Raw overwrite (expert only)

`setCalibration(curve)` writes a 12-byte `Uint8Array` directly to the device, bypassing the measured-point flow. Use it
to restore a backed-up curve or clone calibration between identical devices. **WARNING: EXPERT ONLY** - incorrect values
will produce wrong force readings.

### Performance metadata

Progressor includes [performance metadata](/api/methods/notify#callback-payload-forcemeasurement) on every `notify()`
payload like all streaming devices. For Progressor, `performance.samplingRateHz` is computed from **device timestamps**:
number of samples in the last 1 second of device time. Payload length / 8 gives `performance.samplesPerPacket`.

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
(single-byte opcodes with optional payload), data point (notifications), and includes notes on auto-shutdown and data
format. Useful for low-level integration or verification with tools like nRF Connect.

Tindeq’s example client ([progressor_client.py](https://tindeq.com/progressor_api/)) demonstrates the documented command
set (opcodes 100–111). Additional commands implemented are based on firmware analysis and device testing rather than the
public specification.

See [Guide](/guide) and [API](/api/) for more.
