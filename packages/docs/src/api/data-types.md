---
title: Data types
description: ForceStats, ForceMeasurement, ForceUnit, Service, Characteristic, DownloadPacket, callbacks, Commands.
---

# Data types

Shared types used across devices.

## ForceUnit

Force-equivalent display unit used for all values in a measurement (`"kg"` or `"lbs"`).

```ts
export type ForceUnit = "kg" | "lbs"
```

### convertForce

Converts a force value between kg and lbs. All devices stream in kg except the Force Board (lbs); use
`notify(callback, "lbs")` to get payloads in your preferred unit, or convert manually with `convertForce`.

```ts
import { convertForce } from "@hangtime/grip-connect"

convertForce(10, "kg", "lbs") // ~22.05
convertForce(22.05, "lbs", "kg") // ~10
```

## ForceStats

Core statistical values describing force over a time window or session.

| Property  | Type     | Description                                                                  |
| --------- | -------- | ---------------------------------------------------------------------------- |
| `current` | `number` | Instantaneous total force at the current sample moment.                      |
| `peak`    | `number` | Highest instantaneous force in the measured window/session.                  |
| `mean`    | `number` | Mean (average) force across all samples in the window/session.               |
| `min`     | `number` | Lowest instantaneous force in the measured window/session (e.g. for charts). |

## ForceMeasurement

Complete force measurement including timing, unit, and optional spatial distribution. Extends `ForceStats`. Passed to
the `notify()` callback; represent a single real-time sample.

| Property        | Type        | Description                                                       |
| --------------- | ----------- | ----------------------------------------------------------------- |
| `unit`          | `ForceUnit` | Display unit for all force values (kgf or lbf).                   |
| `timestamp`     | `number`    | Unix epoch in milliseconds when the measurement was recorded.     |
| `current`       | `number`    | From ForceStats: force at the current sample.                     |
| `peak`          | `number`    | From ForceStats: highest force in the session.                    |
| `mean`          | `number`    | From ForceStats: mean force over the session.                     |
| `min`           | `number`    | From ForceStats: lowest force in the session.                     |
| `performance?`  | `object`    | Optional performance metadata (all streaming devices); see below. |
| `distribution?` | `object`    | Optional zone distribution (see below).                           |

**performance** (optional): Each `notify()` payload from devices that stream force data includes `performance` when
available. Use `data.performance?.samplingRateHz` for data rate.

| Field                          | Description                                                     |
| ------------------------------ | --------------------------------------------------------------- |
| `performance.notifyIntervalMs` | Time in ms since the previous BLE notification (packet).        |
| `performance.packetIndex`      | Cumulative count of data packets received this session.         |
| `performance.samplesPerPacket` | Number of samples in the current packet.                        |
| `performance.samplingRateHz`   | Data rate in Hz (device- or session-specific; see device docs). |

**distribution** (optional): Each zone is a full `ForceMeasurement` (same structure: unit, timestamp, current, peak,
mean, min). One level deep; nested distribution should be avoided. Used by devices like Motherboard for
left/center/right zones.

```ts
import type { ForceMeasurement, ForceUnit } from "@hangtime/grip-connect"

// Default: payload in kg. Pass "lbs" to receive values in lbs.
device.notify((data: ForceMeasurement) => {
  console.log(data.current, data.peak, data.mean, data.unit)
  if (data.performance?.samplingRateHz != null) console.log("Rate:", data.performance.samplingRateHz, "Hz")
  if (data.distribution) {
    console.log(
      "Left:",
      data.distribution.left?.current,
      "Center:",
      data.distribution.center?.current,
      "Right:",
      data.distribution.right?.current,
    )
  }
})
device.notify((data) => { ... }, "lbs")
```

## Service

Bluetooth GATT service descriptor.

| Property          | Type               | Description                         |
| ----------------- | ------------------ | ----------------------------------- |
| `name`            | `string`           | Service name.                       |
| `id`              | `string`           | Service identifier.                 |
| `uuid`            | `string`           | Service UUID.                       |
| `characteristics` | `Characteristic[]` | Characteristics under this service. |

### Characteristic

Each characteristic in `characteristics` has:

| Property          | Type                                | Description                                                    |
| ----------------- | ----------------------------------- | -------------------------------------------------------------- |
| `name`            | `string`                            | Characteristic name.                                           |
| `id`              | `string`                            | Characteristic identifier (e.g. `"rx"`, `"tx"`, `"level"`).    |
| `uuid`            | `string`                            | Characteristic UUID.                                           |
| `characteristic?` | `BluetoothRemoteGATTCharacteristic` | Web Bluetooth characteristic reference (set after connection). |

## DownloadPacket

Extends `ForceMeasurement` with export-specific fields. Used by `download()` for CSV, JSON, and XML export.

Inherits from ForceMeasurement: `timestamp`, `unit`, `current`, `peak`, `mean`, `min`, `performance`, `distribution?`.

| Property  | Type       | Description                        |
| --------- | ---------- | ---------------------------------- |
| `battRaw` | `number`?  | Battery raw value (0 when N/A).    |
| `samples` | `number[]` | Raw sensor/ADC values from device. |

Force values come from `current` (single-sample) or `distribution` (multi-zone, e.g. Motherboard).

`DownloadPacket` is used internally; the public API is `device.download(format)`.

## Callback types

| Type             | Description                                               |
| ---------------- | --------------------------------------------------------- |
| `NotifyCallback` | `(data: ForceMeasurement) => void`, used by `notify()`.   |
| `WriteCallback`  | `(data: string) => void`, used by `write()` for response. |
| `ActiveCallback` | `(data: boolean) => void`, used by `active()`.            |

These are available from the main package and from `@hangtime/grip-connect/src/interfaces/callback.interface.js` if
needed for tree-shaking.

## Commands

The `commands` property on each device holds device-specific command strings (or numbers) used with `write()`. Not every
device implements every command. Common commands include:

| Command                 | Description                    | Typical devices         |
| ----------------------- | ------------------------------ | ----------------------- |
| `START_WEIGHT_MEAS`     | Start weight/force measurement | Motherboard, Progressor |
| `STOP_WEIGHT_MEAS`      | Stop measurement               | Motherboard, Progressor |
| `SLEEP`                 | Put device to sleep            | Motherboard, Progressor |
| `GET_SERIAL`            | Get serial number              | Motherboard, Progressor |
| `GET_CALIBRATION`       | Get calibration data           | Motherboard             |
| `TARE_SCALE`            | Tare (zero) the scale          | Progressor              |
| `GET_BATTERY_VOLTAGE`   | Get battery voltage            | Progressor              |
| `GET_FIRMWARE_VERSION`  | Get firmware version           | Progressor              |
| `ADD_CALIBRATION_POINT` | Add calibration point (kg)     | Progressor              |
| `SAVE_CALIBRATION`      | Save calibration to device     | Progressor              |

See device-specific docs under [Devices](/devices/) for which commands each device supports. For the full device API,
see [Device interface](/api/device-interface) and [Exports](/api/exports).
