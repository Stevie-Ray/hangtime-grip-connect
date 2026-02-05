---
title: Adding a custom device
description: Contribute a new device to the library or use a custom BLE device in your app.
---

# Adding a custom device

This guide explains how to add support for a custom Bluetooth Low Energy (BLE) device in two scenarios:

1. **Contributing a device** - Add a new device to the monorepo so it is shipped with the library (web, Capacitor, React
   Native, CLI).
2. **Using a custom device in your app** - Extend the base `Device` class in your own project for hardware that is not
   in the library, and is not mass produced / commercial.

You need your device’s **GATT service and characteristic UUIDs**, the **advertising name or name prefix** used during
scanning, and an understanding of the **protocol** (how the device sends force/mass data and any commands).

---

## Contributing a device

Adding a device to the library involves the **core** package (required) and optionally the **Capacitor**, **React
Native**, and **CLI** packages. The core package holds the protocol logic; platform packages wrap it for Web Bluetooth,
native BLE, or CLI.

### 1. Create the device interface

Define a TypeScript interface that extends `IDevice` and declares any device-specific methods (e.g. `battery()`,
`stream()`, `led()`).

**File:** `packages/core/src/interfaces/device/<device-name>.interface.ts`

```ts
import type { IDevice } from "../device.interface.js"

export interface IMyBoard extends IDevice {
  /** Device-specific method example. */
  battery(): Promise<string | undefined>
}
```

Use kebab-case for the file name (e.g. `my-board.interface.ts`). The interface is used for typing the model and for
public API exports.

### 2. Create the device model

Implement the device by extending the abstract `Device` class and implementing your interface.

**File:** `packages/core/src/models/device/<device-name>.model.ts`

- **Constructor:** Pass `filters`, `services`, and optionally `commands` into `super()`.
- **Filters:** `BluetoothLEScanFilter[]` - at least one of `name`, `namePrefix`, or `services` so the Web Bluetooth
  request can find the device (e.g. `[{ namePrefix: "MyBoard" }]`).
- **Services:** Array of `Service` objects. Each has `name`, `id` (logical id used in code), `uuid` (BLE service UUID),
  and `characteristics`: array of `{ name, id, uuid }`. The characteristic with `id: "rx"` is the one used for
  notifications; it will be subscribed to in `onConnected`. Use `id: "tx"` for write-only characteristics if the device
  has a command channel.
- **Commands:** Optional `Commands` object (e.g. `{ START_WEIGHT_MEAS: "e", STOP_WEIGHT_MEAS: "f" }`) if the device uses
  write commands.
- **handleNotifications:** Override `handleNotifications(value: DataView)` to parse incoming BLE data. Update
  `downloadPackets`, `peak`, `mean`, `sum`, `dataPointCount`, call `activityCheck(numericData)` if appropriate, and
  invoke `this.notifyCallback(this.buildForceMeasurement(current, distribution?))` so app code receives real-time data
  via `notify()`.
- **Device-specific methods:** Implement any methods declared in your interface (e.g. `battery()`, `stream()`,
  `stop()`), using `this.read()`, `this.write()`, and `this.commands` as needed.

Example skeleton:

```ts
import { Device } from "../device.model.js"
import type { IMyBoard } from "../../interfaces/device/my-board.interface.js"

export class MyBoard extends Device implements IMyBoard {
  constructor() {
    super({
      filters: [{ namePrefix: "MyBoard" }],
      services: [
        {
          name: "Custom Service",
          id: "main",
          uuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
          characteristics: [
            { name: "Notify", id: "rx", uuid: "yyyyyyyy-yyyy-yyyy-yyyy-yyyyyyyyyyyy" },
            { name: "Write", id: "tx", uuid: "zzzzzzzz-zzzz-zzzz-zzzz-zzzzzzzzzzzz" },
          ],
        },
      ],
      commands: {
        START_WEIGHT_MEAS: "e",
        STOP_WEIGHT_MEAS: "f",
      },
    })
  }

  override handleNotifications = (value: DataView): void => {
    if (!value?.buffer) return
    this.updateTimestamp()
    // Parse value and update downloadPackets, peak, mean, sum, etc.
    // Call this.notifyCallback(this.buildForceMeasurement(current, distribution?))
    // Optionally this.activityCheck(numericValue)
  }

  battery = async (): Promise<string | undefined> => {
    // e.g. read or write and use writeCallback
    return undefined
  }
}
```

Reference existing devices in `packages/core/src/models/device/` (e.g.
[Climbro](https://github.com/Stevie-Ray/hangtime-grip-connect/blob/main/packages/core/src/models/device/climbro.model.ts)
for notify-only,
[Progressor](https://github.com/Stevie-Ray/hangtime-grip-connect/blob/main/packages/core/src/models/device/progressor.model.ts)
for read/write and commands) for full patterns including tare, `writeCallback`, and response parsing.

### 3. Export from the core package

- **Interfaces:** Export the new interface from `packages/core/src/interfaces/index.ts` and from
  `packages/core/src/index.ts` (in the type export list).
- **Models:** Export the new class from `packages/core/src/models/index.ts` and from `packages/core/src/index.ts` (in
  the value export list).

After this step, the device is available when users install `@hangtime/grip-connect`.

### 4. Optional: Capacitor wrapper

To support the device in the Capacitor package, add a wrapper that overrides connection and I/O to use
`@capacitor-community/bluetooth-le` and, if needed, `@capacitor/filesystem` for `download()`.

- **File:** `packages/capacitor/src/models/device/<device-name>.model.ts`
- Extend the **core** device class (e.g. `import { MyBoard as MyBoardBase } from "@hangtime/grip-connect"`), then
  override `connect`, `disconnect`, `onConnected`, `read`, and `write` to use `BleClient`. Override `download` if you
  want mobile-friendly export (e.g. writing to `Directory.Documents`).
- Export the wrapper from `packages/capacitor/src/models/index.ts` and `packages/capacitor/src/index.ts`.

Use
[Climbro’s Capacitor model](https://github.com/Stevie-Ray/hangtime-grip-connect/blob/main/packages/capacitor/src/models/device/climbro.model.ts)
as a template.

### 5. Optional: React Native wrapper

Add a similar wrapper under `packages/react-native/src/models/device/` that uses the React Native BLE stack (e.g.
[react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx)), and export it from the package index.

### 6. Optional: CLI

Re-export the core device from `packages/cli/src/models/index.ts` (and main entry) so the CLI can use it; add a
device-specific wrapper only if the CLI needs different behavior.

### 7. Document the device

- Add a device page under `packages/docs/src/devices/<device-name>.md` (see [Climbro](/devices/climbro) for structure).
- Add a sidebar entry in `packages/docs/src/.vitepress/config.mts` under the Devices section.

Run the docs dev server (`npm run dev:docs`) and build (`npm run build`) to confirm everything compiles and the new
device appears in the docs.

---

## Using a custom device in your app

For custom, non-commercial hardware, extend `Device` in **your project**. You can simply do the following:

```ts
import { Device } from "@hangtime/grip-connect"

class MyCustomBoard extends Device {
  constructor() {
    super({
      filters: [{ namePrefix: "MY-BOARD" }],
      services: [
        {
          name: "Force Service",
          id: "force",
          uuid: "your-service-uuid",
          characteristics: [{ name: "Data", id: "rx", uuid: "your-characteristic-uuid" }],
        },
      ],
    })
  }

  override handleNotifications = (value: DataView): void => {
    if (!value?.buffer) return
    this.updateTimestamp()
    const current = value.getFloat32(0, true) // example
    this.peak = Math.max(this.peak, current)
    this.sum += current
    this.dataPointCount++
    this.mean = this.sum / this.dataPointCount
    this.notifyCallback(this.buildForceMeasurement(current))
  }
}
```
