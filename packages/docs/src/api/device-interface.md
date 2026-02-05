---
title: Device interface
description: "Base IDevice: connect, notify, active, read, write, tare, download."
---

# Device interface

All devices implement the base `IDevice` interface. Device-specific classes (e.g. `Motherboard`, `Progressor`) extend
this with extra methods like `battery()`, `stream()`, and `led()`.

## Properties

| Property    | Type                           | Description                                                                          |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------------ |
| `filters`   | `BluetoothLEScanFilter[]`      | Filters used to identify the device during scanning.                                 |
| `services`  | `Service[]`                    | Bluetooth services exposed by the device. See [Data types](/api/data-types#service). |
| `bluetooth` | `BluetoothDevice \| undefined` | Reference to the Web Bluetooth `BluetoothDevice` after connection.                   |
| `commands`  | `Commands`                     | Device-specific command set for read/write operations.                               |

## Methods

### Connection

| Method                          | Description                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `connect(onSuccess?, onError?)` | Connects to the device. Requires a user gesture and secure context. Callbacks are optional. |
| `disconnect()`                  | Disconnects and cleans up listeners and GATT.                                               |
| `isConnected()`                 | Returns whether the device is currently connected.                                          |

### Data and notifications

| Method                        | Description                                                                                                              |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `notify(callback)`            | Sets the callback for real-time mass/force data. Callback receives a `ForceMeasurement`.                                 |
| `active(callback?, options?)` | Sets the callback for activity status (user pulling). Options: `{ threshold?, duration? }` (defaults: `2.5`, `1000` ms). |

### Read / write

| Method                                                              | Description                                                     |
| ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `read(serviceId, characteristicId, duration?)`                      | Reads a characteristic. Returns `Promise<string \| undefined>`. |
| `write(serviceId, characteristicId, message, duration?, callback?)` | Writes to a characteristic. Optional callback for response.     |

### Calibration and export

| Method              | Description                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tare(duration?)`   | Starts tare calibration. Returns `boolean`. Not all devices support this. Default duration: `5000` ms.                                                                      |
| `download(format?)` | Exports session data as a file. Returns `Promise<void>`. `format`: `"csv"` \| `"json"` \| `"xml"` (default: `"csv"`). Filename: `data-export-YYYY-MM-DD-HH-MM-SS.{format}`. |

## Examples

```ts
// Connect with callbacks
await device.connect(
  async () => {
    console.log("Connected")
    const value = await device.read("battery", "level", 1000)
    console.log("Battery:", value)
  },
  (error) => console.error(error.message),
)

// Notify and active
device.notify((data) => console.log(data.current))
device.active((isActive) => console.log(isActive), { threshold: 3, duration: 1500 })

// Disconnect
device.disconnect()
```

See [Data types](/api/data-types) for `ForceMeasurement` and `Service`, [Exports](/api/exports) for all device classes,
and [Devices](/devices/) for device-specific methods like `battery()` and `led()`.
