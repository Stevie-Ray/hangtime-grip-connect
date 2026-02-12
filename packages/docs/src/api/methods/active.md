---
title: active
description: Sets the callback for activity status (user pulling).
---

# active

Sets the callback for activity status. The callback receives a boolean indicating whether the user is actively pulling
on the device. Options allow tuning the threshold and duration used to determine activity.

## Signature

```ts
active(callback?: (data: boolean) => void, options?: { threshold?: number; duration?: number }): void
```

## Parameters

| Parameter         | Type                      | Default | Description                                              |
| ----------------- | ------------------------- | ------- | -------------------------------------------------------- |
| callback          | `(data: boolean) => void` | -       | Invoked when activity status changes.                    |
| options           | `object`                  | -       | Optional configuration.                                  |
| options.threshold | `number`                  | `2.5`   | Force threshold (kg) above which the device is "active". |
| options.duration  | `number`                  | `1000`  | Duration in milliseconds to monitor for activity.        |

## Returns

`void`

## Types

| Type             | Description                                           |
| ---------------- | ----------------------------------------------------- |
| `ActiveCallback` | `(data: boolean) => void` - receives activity status. |

## Example

```ts
device.active((isActive) => {
  console.log(`Device is ${isActive ? "active" : "inactive"}`)
})

// With custom threshold and duration
device.active((isActive) => console.log(isActive), { threshold: 3, duration: 1500 })
```
