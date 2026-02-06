# Devices

All devices implement the shared [device interface](/api/device-interface). Each device class adds its own methods (e.g.
`battery()`, `stream()`, `led()`). Pick a device below for wiring, methods, and links to hardware.

## Shared methods

Every device supports these methods. Optional callbacks and device-specific support are noted below.

### Connection

| Method                          | Description                                                                                 |
| ------------------------------- | ------------------------------------------------------------------------------------------- |
| `connect(onSuccess?, onError?)` | Connects to the device. Requires a user gesture and secure context. Callbacks are optional. |
| `disconnect()`                  | Disconnects and cleans up listeners and GATT.                                               |
| `isConnected()`                 | Returns whether the device is currently connected.                                          |

### Data and notifications

| Method                        | Description                                                                                                                                                                                          |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `notify(callback, unit?)`     | Sets the callback for real-time mass/force data. Callback receives a `ForceMeasurement`. Optional second argument: `"kg"` (default) or `"lbs"` (see [Data types](/api/data-types#forcemeasurement)). |
| `active(callback?, options?)` | Sets the callback for activity status (e.g. user pulling). Options: `{ threshold?, duration? }` (defaults: `2.5`, `1000` ms).                                                                        |

### Read / write

| Method                                                              | Description                                                     |
| ------------------------------------------------------------------- | --------------------------------------------------------------- |
| `read(serviceId, characteristicId, duration?)`                      | Reads a characteristic. Returns `Promise<string \| undefined>`. |
| `write(serviceId, characteristicId, message, duration?, callback?)` | Writes to a characteristic. Optional callback for response.     |

Use the device’s `commands` and `services` to get valid `serviceId` and `characteristicId` values.

### Calibration and export

| Method              | Description                                                                                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `tare(duration?)`   | Starts tare (zero) calibration. Returns `boolean`. Not all devices support this. Default duration: `5000` ms.                                                               |
| `download(format?)` | Exports session data as a file. Returns `Promise<void>`. `format`: `"csv"` \| `"json"` \| `"xml"` (default: `"csv"`). Filename: `data-export-YYYY-MM-DD-HH-MM-SS.{format}`. |

See [Device interface](/api/device-interface) for properties (`filters`, `services`, `bluetooth`, `commands`) and
examples.

## Device categories

- **Hangboards** - Motherboard, Climbro, mySmartBoard, SmartBoard Pro (force streaming, optional LED).
- **Dynamometers / force plates** - Progressor, ForceBoard, WH-C06, Entralpi (force measurement, tare, stream).
- **LED system boards** - Kilter Board (and compatible Aurora boards): route display via `led()`.
- **Other** - PB-700BT (gyroscopic hand exerciser); Dyno (upcoming).

## Device classes

| Class                                    | Device                                   | Typical use                                        |
| ---------------------------------------- | ---------------------------------------- | -------------------------------------------------- |
| [Motherboard](/devices/motherboard)      | Griptonite Motherboard                   | Hangboard, LED (green/red/orange), stream, battery |
| [Progressor](/devices/progressor)        | Tindeq Progressor                        | Dynamometer, stream, battery, tare                 |
| [ForceBoard](/devices/forceboard)        | PitchSix Force Board                     | Portable force plate, quick measure                |
| [KilterBoard](/devices/kilterboard)      | Kilter Board (and compatible LED boards) | LED route display                                  |
| [Entralpi](/devices/entralpi)            | Entralpi / Lefu / Unique CW275           | Scale (force plate), stream                        |
| [Climbro](/devices/climbro)              | Climbro                                  | Hangboard                                          |
| [mySmartBoard](/devices/mysmartboard)    | mySmartBoard                             | Hangboard                                          |
| [SmartBoardPro](/devices/smartboard-pro) | SmartBoard Pro                           | Hangboard                                          |
| [WHC06](/devices/wh-c06)                 | Weiheng WH-C06                           | Dynamometer, stream                                |
| [PB700BT](/devices/pb-700bt)             | NSD PB-700BT                             | Gyroscopic hand exerciser                          |
| [Dyno](/devices/dyno)                    | Frez Dyno                                | Dynamometer (upcoming)                             |

## Device-specific methods

Many devices add methods on top of the shared interface:

- **Stream**: Call `stream(durationMs)` after connect (e.g. Progressor, ForceBoard, Motherboard). Use `0` or omit for
  continuous stream; call `stop()` to end. Data is delivered to the callback set with `notify()`.
- **Battery**: Where supported: `await device.battery()` after connect.
- **Tare**: Uses the shared `tare(duration?)`; support varies by device.
- **LED**: Where supported (e.g. Motherboard, Kilter Board): `await device.led("red")` or `device.led()` to turn off.
- **Download**: Uses the shared `download(format?)` to export session data.

See the [API](/api/) for the full interface and [Data types](/api/data-types) for `ForceMeasurement` and callbacks.
