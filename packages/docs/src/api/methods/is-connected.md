---
title: isConnected
description: Returns whether the device is currently connected.
---

# isConnected

Checks if the device is currently connected via Bluetooth GATT.

## Signature

```ts
isConnected(): boolean
```

## Returns

`boolean` - `true` if connected, `false` otherwise.

## Example

```ts
if (device.isConnected()) {
  console.log("Device is connected")
  const level = await device.read("battery", "level", 1000)
  console.log("Battery level:", level)
} else {
  console.log("Device is not connected")
}
```
