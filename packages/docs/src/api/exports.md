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

Use to instantiate and connect to a device. Example: `new Motherboard()` or `new Progressor()`.

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

Use for TypeScript types when typing variables, parameters, or return values. Example:
`const device: IMotherboard = new Motherboard()`.

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

### Usage

```ts
import { Motherboard, type IMotherboard, type ForceMeasurement } from "@hangtime/grip-connect"

const device: IMotherboard = new Motherboard()
device.notify((data: ForceMeasurement) => console.log(data))
device.notify((data) => console.log(data), "lbs")
device.notify((data) => console.log(data), "n")
```

See [Device interface](/api/device-interface), [Methods](/api/methods/), and [Devices](/devices/) for details.
