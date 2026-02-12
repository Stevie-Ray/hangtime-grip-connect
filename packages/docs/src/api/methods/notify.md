---
title: notify
description: Sets the callback for real-time force data.
---

# notify

Sets the callback for real-time mass/force data from the device. The callback receives a `ForceMeasurement` object with
`current`, `peak`, `mean`, `min`, `unit`, and `timestamp`. Optional `unit` controls the display unit of values in the
payload.

## Signature

```ts
notify(callback: (data: ForceMeasurement) => void, unit?: ForceUnit): void
```

## Parameters

| Parameter | Type                               | Default | Description                                                        |
| --------- | ---------------------------------- | ------- | ------------------------------------------------------------------ |
| callback  | `(data: ForceMeasurement) => void` | -       | Invoked on each data sample.                                       |
| unit      | `ForceUnit`                        | `"kg"`  | Display unit ("kg", "lbs" or "n") for all force values in payload. |

## Returns

`void`

## Types

| Type               | Description                                          |
| ------------------ | ---------------------------------------------------- |
| `ForceUnit`        | Display unit for force (`"kg"` \| `"lbs"` \| `"n"`). |
| `ForceMeasurement` | Real-time force data passed to the callback.         |
| `NotifyCallback`   | `(data: ForceMeasurement) => void`                   |

## Callback payload (ForceMeasurement)

The callback receives an object with:

| Property        | Type        | Description                                                                               |
| --------------- | ----------- | ----------------------------------------------------------------------------------------- |
| `unit`          | `ForceUnit` | Display unit for all force values.                                                        |
| `timestamp`     | `number`    | Unix epoch in milliseconds when the measurement was recorded.                             |
| `current`       | `number`    | Instantaneous force at the current sample.                                                |
| `peak`          | `number`    | Highest force in the session.                                                             |
| `mean`          | `number`    | Mean force over the session.                                                              |
| `min`           | `number`    | Lowest force in the session.                                                              |
| `performance?`  | `object`    | Optional: `notifyIntervalMs`, `packetIndex`, `samplesPerPacket`, `samplingRateHz` (Hz).   |
| `distribution?` | `object`    | Optional: `left`, `center`, `right` zones (Motherboard). Each zone is a ForceMeasurement. |

All devices stream in kg except the Force Board (lbs). Use `unit` to receive payloads in your preferred unit.

## Example

```ts
// Default: payload in kg
device.notify((data) => console.log(data.current, data.peak))

// Request payload in lbs or newtons
device.notify((data) => console.log(data.current), "lbs")
device.notify((data) => console.log(data.current), "n")

// With performance and distribution
device.notify((data) => {
  console.log(data.current, data.peak)
  if (data.performance?.samplingRateHz != null) console.log("Rate:", data.performance.samplingRateHz, "Hz")
  if (data.distribution) {
    console.log("Left:", data.distribution.left?.current, "Center:", data.distribution.center?.current)
  }
})
```
