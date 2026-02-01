# Devices

All Grip Connect devices implement the shared [device interface](/api/device-interface) (`connect`, `disconnect`,
`notify`, `active`, `read`, `write`, `tare`, `download`). Each device class adds its own methods (e.g. `battery()`,
`stream()`, `led()`). Pick a device below for wiring, methods, and links to hardware.

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

## Common patterns

- **Stream**: Call `stream(durationMs)` after connect. Use `0` or omit for continuous stream; call `stop()` to end. Data
  is delivered to the callback set with `notify()`.
- **Battery**: Where supported: `await device.battery()` after connect.
- **Tare**: Where supported: `device.tare(durationMs)` to zero the scale.
- **LED**: Where supported (e.g. Motherboard, Kilter Board): `await device.led("red")` or `device.led()` to turn off.
- **Download**: `await device.download("csv" | "json" | "xml")` to export session data.

See the [API Reference](/api/) for the full interface and [Data types](/api/data-types) for `massObject` and callbacks.
