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

## ForceStats

Core statistical values describing force over a time window or session.

| Property  | Type     | Description                                                    |
| --------- | -------- | -------------------------------------------------------------- |
| `current` | `number` | Instantaneous total force at the current sample moment.        |
| `peak`    | `number` | Highest instantaneous force in the measured window/session.    |
| `mean`    | `number` | Mean (average) force across all samples in the window/session. |

## ForceMeasurement

Complete force measurement including timing, unit, and optional spatial distribution. Extends `ForceStats`. Passed to
the `notify()` callback; can represent a single real-time sample or a rolling/session summary.

| Property          | Type        | Description                                                       |
| ----------------- | ----------- | ----------------------------------------------------------------- |
| `unit`            | `ForceUnit` | Display unit for all force values (kgf or lbf).                   |
| `timestamp`       | `number`    | Unix epoch in milliseconds when the measurement was recorded.     |
| `samplingRateHz?` | `number`    | Optional sampling frequency in Hz. (for RFD, impulse, filtering). |
| `current`         | `number`    | From ForceStats: force at the current sample.                     |
| `peak`            | `number`    | From ForceStats: highest force in the session.                    |
| `mean`            | `number`    | From ForceStats: mean force over the session.                     |
| `distribution?`   | `object`    | Optional zone distribution (see below).                           |

**distribution** (optional): Each zone is a full `ForceMeasurement` (same structure: unit, timestamp, current, peak,
mean). One level deep; nested distribution should be avoided. Used by devices like Motherboard for left/center/right
zones.

```ts
import type { ForceMeasurement, ForceUnit } from "@hangtime/grip-connect"

device.notify((data: ForceMeasurement) => {
  console.log(data.current, data.peak, data.mean, data.unit)
  if (data.samplingRateHz != null) console.log("Rate:", data.samplingRateHz, "Hz")
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

Internal structure for a single exported data packet (used by `download()`). Exported files contain timestamp, sample
number, battery raw value, samples, and masses.

| Property    | Type       | Description                             |
| ----------- | ---------- | --------------------------------------- |
| `received`  | `number`   | Timestamp when the packet was received. |
| `sampleNum` | `number`   | Sample number.                          |
| `battRaw`   | `number`   | Battery raw value.                      |
| `samples`   | `number[]` | Sample values.                          |
| `masses`    | `number[]` | Mass values.                            |

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

| Command             | Description                    | Typical devices         |
| ------------------- | ------------------------------ | ----------------------- |
| `START_WEIGHT_MEAS` | Start weight/force measurement | Motherboard, Progressor |
| `STOP_WEIGHT_MEAS`  | Stop measurement               | Motherboard, Progressor |
| `SLEEP`             | Put device to sleep            | Motherboard, Progressor |
| `GET_SERIAL`        | Get serial number              | Motherboard, Progressor |
| `GET_CALIBRATION`   | Get calibration data           | Motherboard             |
| `TARE_SCALE`        | Tare (zero) the scale          | Progressor              |
| `GET_BATT_VLTG`     | Get battery voltage            | Progressor              |
| `GET_FW_VERSION`    | Get firmware version           | Progressor              |

See device-specific docs under [Devices](/devices/) for which commands each device supports. For the full device API,
see [Device interface](/api/device-interface) and [Exports](/api/exports).
