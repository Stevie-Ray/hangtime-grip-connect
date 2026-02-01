---
title: Data types
description: massObject, Service, Characteristic, DownloadPacket, callbacks, Commands.
---

# Data types

Shared types used across devices.

## massObject

Real-time mass/force data passed to the `notify()` callback. All numeric values are strings.

| Property      | Type     | Description                     |
| ------------- | -------- | ------------------------------- |
| `massTotal`   | `string` | Total mass/force.               |
| `massMax`     | `string` | Maximum value in the session.   |
| `massAverage` | `string` | Average value.                  |
| `massLeft?`   | `string` | Left zone (e.g. Motherboard).   |
| `massCenter?` | `string` | Center zone (e.g. Motherboard). |
| `massRight?`  | `string` | Right zone (e.g. Motherboard).  |

```ts
import type { massObject } from "@hangtime/grip-connect"

device.notify((data: massObject) => {
  console.log(data.massTotal, data.massMax, data.massAverage)
  if (data.massLeft != null) {
    console.log("Left:", data.massLeft, "Center:", data.massCenter, "Right:", data.massRight)
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
| `NotifyCallback` | `(data: massObject) => void`, used by `notify()`.         |
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
