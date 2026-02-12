---
title: tare
description: Starts tare (zero) calibration.
---

# tare

Initiates tare calibration to zero the scale. Not all devices support this. Check device docs for support.

## Signature

```ts
tare(duration?: number): boolean
```

## Parameters

| Parameter | Type     | Default | Description                                |
| --------- | -------- | ------- | ------------------------------------------ |
| duration  | `number` | `5000`  | Duration in milliseconds for tare process. |

## Returns

`boolean` - `true` if tare was started successfully, `false` if the device does not support tare or it failed to start.

## Example

```ts
const success = device.tare(5000)
if (success) {
  console.log("Tare calibration started")
} else {
  console.log("Tare calibration not supported or failed to start")
}
```
