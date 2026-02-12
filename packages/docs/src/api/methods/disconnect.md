---
title: disconnect
description: Disconnects from the device and cleans up listeners.
---

# disconnect

Disconnects from the device and cleans up. Removes all notification listeners from the device's characteristics, removes
the `gattserverdisconnected` event listener, and attempts to gracefully disconnect the GATT server.

## Signature

```ts
disconnect(): void
```

## Returns

`void`

## Example

```ts
await device.connect(
  async () => {
    await device.stream(5000)
    device.notify((data) => console.log(data.current))
    // ... later
    device.disconnect()
  },
  (err) => console.error(err),
)
```
