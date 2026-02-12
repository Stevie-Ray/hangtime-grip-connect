---
title: read
description: Reads a GATT characteristic from the device.
---

# read

Reads the value of a GATT characteristic from the connected device. Use the device's `commands` and `services` to get
valid `serviceId` and `characteristicId` values.

## Signature

```ts
read(serviceId: string, characteristicId: string, duration?: number): Promise<string | undefined>
```

## Parameters

| Parameter        | Type     | Default | Description                                                 |
| ---------------- | -------- | ------- | ----------------------------------------------------------- |
| serviceId        | `string` | -       | Service identifier (e.g. `"battery"`, `"progressor"`).      |
| characteristicId | `string` | -       | Characteristic identifier (e.g. `"level"`, `"rx"`, `"tx"`). |
| duration         | `number` | `0`     | Milliseconds to wait before resolving. Use for async reads. |

## Returns

`Promise<string | undefined>` - Resolves with the characteristic value, or `undefined` if the read fails.

## Example

```ts
await device.connect(
  async () => {
    const value = await device.read("battery", "level", 1000)
    console.log("Battery level:", value)
  },
  (err) => console.error(err),
)
```

## Service and characteristic IDs

Use `device.services` to get valid `serviceId` and `characteristicId` values. Each service has an `id` (e.g.
`"battery"`, `"progressor"`) and `characteristics`; each characteristic has an `id` (e.g. `"level"`, `"rx"`, `"tx"`).
