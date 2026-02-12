---
title: connect
description: Connects to the device via Web Bluetooth.
---

# connect

Connects to the device via the Web Bluetooth API. Requires a user gesture (e.g. button click) and a secure context
(HTTPS or localhost).

## Signature

```ts
connect(onSuccess?: () => void, onError?: (error: Error) => void): Promise<void>
```

## Parameters

| Parameter | Type                     | Default | Description                                          |
| --------- | ------------------------ | ------- | ---------------------------------------------------- |
| onSuccess | `() => void`             | -       | Optional callback executed on successful connection. |
| onError   | `(error: Error) => void` | -       | Optional callback executed on connection failure.    |

## Returns

`Promise<void>` - Resolves when the connection is established. Rejects if connection fails.

## Example

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()

await device.connect(
  async () => {
    console.log("Connected")
    const value = await device.read("battery", "level", 1000)
    console.log("Battery:", value)
  },
  (error) => console.error("Connection failed:", error.message),
)
```

## Requirements

- **User gesture:** Must be called from a user interaction (click, tap, keypress).
- **Secure context:** Page must be served over HTTPS or from `localhost`.
