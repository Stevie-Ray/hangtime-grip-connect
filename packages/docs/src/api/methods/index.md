---
title: API Methods
description: Method reference for connect, notify, read, write, tare, download, and device-specific methods.
---

# API Methods

All devices implement the base [device interface](/api/device-interface). Base methods (connect, disconnect, notify,
etc.) are available on every device. Some devices add methods like `battery()`, `stream()`, and `led()`.

## Connection

| Method                                   | Description                                                         |
| ---------------------------------------- | ------------------------------------------------------------------- |
| [connect](/api/methods/connect)          | Connects to the device. Requires a user gesture and secure context. |
| [disconnect](/api/methods/disconnect)    | Disconnects and cleans up listeners and GATT.                       |
| [isConnected](/api/methods/is-connected) | Returns whether the device is currently connected.                  |

## Data and notifications

| Method                        | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| [notify](/api/methods/notify) | Sets the callback for real-time mass/force data.      |
| [active](/api/methods/active) | Sets the callback for activity status (user pulling). |

## Read / write

| Method                      | Description                                                      |
| --------------------------- | ---------------------------------------------------------------- |
| [read](/api/methods/read)   | Reads a GATT characteristic.                                     |
| [write](/api/methods/write) | Writes to a GATT characteristic with optional response callback. |

## Calibration and export

| Method                            | Description                                                   |
| --------------------------------- | ------------------------------------------------------------- |
| [tare](/api/methods/tare)         | Starts tare (zero) calibration. Not all devices support this. |
| [download](/api/methods/download) | Exports session data as CSV, JSON, or XML.                    |

## Device-specific methods

These methods are available only on certain devices. See each page for supported device classes.

| Method                          | Description                                                 |
| ------------------------------- | ----------------------------------------------------------- |
| [battery](/api/methods/battery) | Battery or voltage information.                             |
| [stream](/api/methods/stream)   | Start force stream. Use `stop()` to end.                    |
| [led](/api/methods/led)         | Set LED color or route display. Signature varies by device. |
| [stop](/api/methods/stop)       | Stop an ongoing stream.                                     |
