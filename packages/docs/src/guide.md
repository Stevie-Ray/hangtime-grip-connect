---
title: Quick start guide
description: Connect to a device, subscribe to data, and stream in a few steps.
---

# Quick start guide

This guide walks through connecting to a device, subscribing to data, and streaming. The pattern is the same for all
devices; only the class and device-specific methods change.

## 1. Choose your device

Import the device class from `@hangtime/grip-connect`. For a Griptonite Motherboard:

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()
```

For other devices, swap the import: `Progressor`, `ForceBoard`, `KilterBoard`, `Entralpi`, `Climbro`, `mySmartBoard`,
`SmartBoardPro`, `WHC06`, `PB700BT`. See [Devices](/devices/) for the full list.

## 2. Optional: handle real-time data

Use `notify()` to receive mass/force data as the device sends it:

```ts
device.notify((data) => {
  console.log(data.current, data.peak, data.mean)
  // Optional: data.distribution?.left, .center, .right (e.g. Motherboard)
})
```

The callback receives a `ForceMeasurement` with numeric values and a `unit`. See
[notify](/api/methods/notify#callback-payload-forcemeasurement).

## 3. Optional: detect activity

Use `active()` to get notified when the user is pulling (above a threshold for a duration):

```ts
device.active((isActive) => console.log(isActive ? "Active" : "Inactive"), { threshold: 2.5, duration: 1000 })
```

`threshold` and `duration` are optional (defaults: `2.5`, `1000` ms).

## 4. Connect

Call `connect(onSuccess, onError)`. Connection must be triggered by a user gesture (e.g. button click) and run in a
secure context (HTTPS or localhost).

```ts
await device.connect(
  async () => {
    console.log("Connected")
    // Use device-specific methods here
  },
  (error) => console.error(error.message),
)
```

## 5. Use device-specific methods

Inside the success callback you can:

- Read **battery** (where supported): `await device.battery()`
- **Stream** force data: `await device.stream(durationMs)`; use `0` or omit for continuous stream
- **Stop** stream: `await device.stop()` (if stream is continuous)
- **Tare** (where supported): `device.tare(durationMs)`
- **LED** (where supported): e.g. `await device.led("red")` or `await device.led()` to turn off
- **Download** session data: `device.download("csv" | "json" | "xml")`

Example for a Motherboard:

```ts
await device.connect(
  async () => {
    const battery = await device.battery()
    console.log("Battery:", battery)
    await device.stream(30000) // 30 seconds
    device.download("json")
    device.disconnect()
  },
  (err) => console.error(err),
)
```

## 6. Disconnect

When finished, call `disconnect()`:

```ts
device.disconnect()
```

---

## Full example

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()

device.notify((data) => console.log("Force:", data.current, data.unit))
device.active((isActive) => console.log("Active:", isActive), { threshold: 2.5, duration: 1000 })

document.querySelector("#btn").addEventListener("click", async () => {
  await device.connect(
    async () => {
      console.log("Battery:", await device.battery())
      await device.stream(30000)
      device.download("json")
      device.disconnect()
    },
    (err) => console.error(err.message),
  )
})
```

```html
<button id="btn" type="button">Connect</button>
```

## Error handling

Always pass an `onError` callback to `connect()` so connection failures and user cancellation are handled:

```ts
await device.connect(
  async () => {
    /* ... */
  },
  (error) => {
    if (error.message?.includes("User cancelled")) {
      console.log("User cancelled the connection")
    } else {
      console.error("Connection failed:", error.message)
    }
  },
)
```

Common errors: **User cancelled** (no retry needed), **Origin is not allowed** (use HTTPS or localhost), **Device not
found** (device on, in range, not connected elsewhere). See
[Browser support: Troubleshooting](/browser-support#troubleshooting).

---

## Next steps

- [API](/api/) - Full device interface and data types.
- [Devices](/devices/) - Per-device methods (battery, LED, stream, tare).
- [Examples](/examples/) - Chart, Flappy Bird, Kilter Board, Pong, Runtime.
