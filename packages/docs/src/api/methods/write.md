---
title: write
description: Writes to a GATT characteristic with optional response callback.
---

# write

Writes a message to a GATT characteristic. Devices that support commands (Motherboard, Progressor, Force Board) expose a
`commands` object-a standardized interface mapping semantic names (e.g. `GET_BATTERY_VOLTAGE`) to device-specific
payloads. Pass `device.commands.COMMAND_NAME` as the message. An optional callback receives the characteristic's
response (e.g. battery voltage, serial number).

## Signature

```ts
write(
  serviceId: string,
  characteristicId: string,
  message: string | Uint8Array | undefined,
  duration?: number,
  callback?: (data: string) => void,
): Promise<void>
```

## Parameters

| Parameter        | Type                                    | Default | Description                                    |
| ---------------- | --------------------------------------- | ------- | ---------------------------------------------- |
| serviceId        | `string`                                | -       | Service identifier.                            |
| characteristicId | `string`                                | -       | Characteristic identifier (e.g. `"tx"`).       |
| message          | `string` \| `Uint8Array` \| `undefined` | -       | Command or payload to write.                   |
| duration         | `number`                                | `0`     | Milliseconds to wait before resolving.         |
| callback         | `(data: string) => void`                | -       | Optional callback for characteristic response. |

## Returns

`Promise<void>` - Resolves when the write completes.

## Example

```ts
import { Progressor } from "@hangtime/grip-connect"

const device = new Progressor()

await device.connect(
  async () => {
    await device.write("progressor", "tx", device.commands.GET_BATTERY_VOLTAGE, 250, (data) =>
      console.log("Battery voltage:", data),
    )
  },
  (err) => console.error(err),
)
```

## Types

| Type            | Description                                                        |
| --------------- | ------------------------------------------------------------------ |
| `WriteCallback` | `(data: string) => void` - receives the characteristic's response. |

## Response

The optional callback receives a `string` - the characteristic's response (e.g. battery voltage, serial number).

## Commands

Devices that support commands (Motherboard, Progressor, Force Board) map semantic names to protocol-specific payloads.
Use `device.commands.COMMAND_NAME` as the message-each device defines its own values. Common commands:

| Command                | Description           | Devices                              |
| ---------------------- | --------------------- | ------------------------------------ |
| `START_WEIGHT_MEAS`    | Start force streaming | Motherboard, Progressor, Force Board |
| `STOP_WEIGHT_MEAS`     | Stop streaming        | Motherboard, Progressor, Force Board |
| `SLEEP`                | Put device to sleep   | Motherboard, Progressor              |
| `GET_SERIAL`           | Get serial number     | Motherboard                          |
| `GET_BATTERY_VOLTAGE`  | Get battery voltage   | Progressor                           |
| `GET_FIRMWARE_VERSION` | Get firmware version  | Progressor                           |
| `TARE_SCALE`           | Tare (zero) the scale | Progressor, Force Board              |
| `START_QUICK_MEAS`     | Quick measure mode    | Force Board                          |

See [Devices](/devices/) for which commands each device supports.
