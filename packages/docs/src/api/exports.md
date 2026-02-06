---
title: Exports
description: Device classes and types from the core package.
---

# Exports

From `@hangtime/grip-connect`. All devices implement the same base [device interface](/api/device-interface); each
device adds its own methods (e.g. `battery()`, `stream()`, `led()`).

## Main entry (`@hangtime/grip-connect`)

Everything below is exported from the main entry. Import from `@hangtime/grip-connect`.

### Classes

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

### Device interfaces

| Type             | Device                                   |
| ---------------- | ---------------------------------------- |
| `IClimbro`       | Climbro                                  |
| `IEntralpi`      | Entralpi / Lefu / Unique CW275           |
| `IForceBoard`    | PitchSix Force Board                     |
| `IKilterBoard`   | Kilter Board (and compatible LED boards) |
| `IMotherboard`   | Griptonite Motherboard                   |
| `ImySmartBoard`  | mySmartBoard                             |
| `IProgressor`    | Tindeq Progressor                        |
| `ISmartBoardPro` | SmartBoard Pro                           |
| `IWHC06`         | Weiheng WH-C06                           |

### Functions

| Function                        | Description                                                                |
| ------------------------------- | -------------------------------------------------------------------------- |
| `convertForce(value, from, to)` | Converts a force value between kg and lbs. `from`/`to`: `"kg"` \| `"lbs"`. |

### Other Types

| Type               | Description                                                                |
| ------------------ | -------------------------------------------------------------------------- |
| `IDevice`          | Base device interface (see [Device interface](/api/device-interface))      |
| `Service`          | Bluetooth service descriptor (see [Data types](/api/data-types))           |
| `ForceUnit`        | Display unit for force (`"kg"` \| `"lbs"`).                                |
| `ForceMeasurement` | Real-time force data (see [Data types](/api/data-types#forcemeasurement)). |

### Usage

```ts
import { Motherboard, convertForce, type IMotherboard, type ForceMeasurement } from "@hangtime/grip-connect"

const device: IMotherboard = new Motherboard()
device.notify((data: ForceMeasurement) => console.log(data))
device.notify((data) => console.log(data), "lbs")
convertForce(10, "kg", "lbs") // ~22.05
```

## Subpaths

Additional entry points for tree-shaking or specific types.

| Subpath                                                         | Exports                                                                              |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| `@hangtime/grip-connect`                                        | All types and classes above (main entry)                                             |
| `@hangtime/grip-connect/src/interfaces/callback.interface.js`   | `ForceUnit`, `ForceMeasurement`, `NotifyCallback`, `WriteCallback`, `ActiveCallback` |
| `@hangtime/grip-connect/src/models/device/kilterboard.model.js` | `KilterBoard`, `KilterBoardPacket` (enum), `KilterBoardPlacementRoles` (const)       |

- **Callback subpath:** Use when you only need callback types (`ForceUnit`, `ForceMeasurement`, `NotifyCallback`,
  `WriteCallback`, `ActiveCallback`) without pulling in device classes.
- **Kilter Board subpath:** Use for tree-shaking when you only need the Kilter Board class, enum, or placement roles.

See [Device interface](/api/device-interface), [Data types](/api/data-types), and [Devices](/devices/) for details.
