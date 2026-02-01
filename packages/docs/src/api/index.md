---
title: API Reference
description: Device classes, types, and subpaths from the core package.
---

# API Reference

Grip Connect exposes device classes and shared types. All devices implement the same base
[device interface](/api/device-interface); each device adds its own methods (e.g. `battery()`, `stream()`, `led()`).

## Exports (core)

From `@hangtime/grip-connect`:

### Device classes

| Class           | Device                                   |
| --------------- | ---------------------------------------- |
| `Motherboard`   | Griptonite Motherboard                   |
| `Progressor`    | Tindeq Progressor                        |
| `ForceBoard`    | PitchSix Force Board                     |
| `KilterBoard`   | Kilter Board (and compatible LED boards) |
| `Entralpi`      | Entralpi / Lefu / Unique CW275           |
| `Climbro`       | Climbro                                  |
| `mySmartBoard`  | mySmartBoard                             |
| `SmartBoardPro` | SmartBoard Pro                           |
| `WHC06`         | Weiheng WH-C06                           |
| `PB700BT`       | NSD PB-700BT                             |

### Types

| Type                             | Description                                                              |
| -------------------------------- | ------------------------------------------------------------------------ |
| `IDevice`                        | Base device interface (see [Device interface](/api/device-interface))    |
| `IMotherboard`, `IProgressor`, … | Device-specific interfaces extending `IDevice`                           |
| `massObject`                     | Real-time mass/force data (see [Data types](/api/data-types#massobject)) |
| `Service`                        | Bluetooth service descriptor (see [Data types](/api/data-types))         |

## Usage

```ts
import { Motherboard, type IMotherboard, type massObject } from "@hangtime/grip-connect"

const device: IMotherboard = new Motherboard()
device.notify((data: massObject) => console.log(data))
```

## Subpaths (core)

- `@hangtime/grip-connect`: main entry (all devices and types)
- `@hangtime/grip-connect/src/interfaces/callback.interface.js`: callback types
- `@hangtime/grip-connect/src/models/device/kilterboard.model.js`: Kilter Board model (e.g. for tree-shaking)

## Quick reference

| Topic                                     | Description                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Device interface](/api/device-interface) | Base `IDevice`: `connect`, `disconnect`, `notify`, `active`, `read`, `write`, `tare`, `download`. |
| [Data types](/api/data-types)             | `massObject`, `Service`, `Characteristic`, `DownloadPacket`, callbacks, `Commands`.               |
| [Devices](/devices/)                      | Per-device methods: `battery()`, `stream()`, `led()`, etc.                                        |

See the [Quick start guide](/guide) for a minimal connect-and-stream example.
