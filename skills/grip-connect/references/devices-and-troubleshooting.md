# Devices And Troubleshooting

Use this file when the user needs device-specific routing, is blocked by connection failures, or asks about unsupported
hardware. It does not assume the user has the Grip Connect repo checked out locally.

## Public device support

These devices are publicly shipped by Grip Connect:

| Device         | Notes                                                                            |
| -------------- | -------------------------------------------------------------------------------- |
| Climbro        | Standard device flow                                                             |
| Entralpi       | Standard device flow                                                             |
| ForceBoard     | Standard device flow                                                             |
| KilterBoard    | LED board workflows                                                              |
| Motherboard    | Common example device                                                            |
| mySmartBoard   | Check device-specific methods before promising `battery()`, `tare()`, or `led()` |
| PB700BT        | Gyroscopic hand exerciser                                                        |
| Progressor     | Common choice for tests and protocols                                            |
| SmartBoard Pro | Check device-specific methods before promising optional commands                 |
| WH-C06         | Special limitations, see below                                                   |

Treat **Frez Dyno** as not currently shipped unless the user is explicitly working on adding support upstream.

## Baseline methods on shipped devices

These behaviors are safe defaults across shipped devices:

- `connect()`
- `disconnect()`
- `notify()`
- `active()`
- `download()`
- `tare()`

Do not assume `battery()`, `stream()`, `stop()`, or `led()` are available unless they are confirmed in the matrix below.

## Optional method support matrix

Confirmed from the exported device implementations:

| Device         | `battery()` | `stream()` | `stop()` | `led()` |
| -------------- | ----------- | ---------- | -------- | ------- |
| Climbro        | yes         | no         | no       | no      |
| Entralpi       | yes         | no         | no       | no      |
| ForceBoard     | yes         | yes        | yes      | no      |
| KilterBoard    | no          | no         | no       | yes     |
| Motherboard    | yes         | yes        | yes      | yes     |
| mySmartBoard   | no          | no         | no       | no      |
| PB700BT        | yes         | no         | no       | no      |
| Progressor     | yes         | yes        | yes      | no      |
| SmartBoard Pro | no          | no         | no       | no      |
| WH-C06         | no          | no         | no       | no      |

Treat missing support as "do not promise this method until the user confirms it from code or docs."

## Common failures

- **Web Bluetooth blocked:** User is not on Chrome, Edge, or Opera, or is not using HTTPS or localhost.
- **No user gesture:** `connect()` was triggered outside a click or tap handler.
- **Mobile BLE issues:** User is on a simulator or Expo Go instead of a physical device with native BLE setup.
- **Device not found:** Device is off, out of range, paired elsewhere, or advertising under a different name than
  expected.
- **User cancelled:** Treat as a normal interruption, not a code defect.

## Important device and platform caveats

- **WH-C06 on web:** `watchAdvertisements` support may require Chrome experimental web platform features.
- **WH-C06 on runtime:** Runtime docs mark it unsupported because the `webbluetooth` stack does not provide
  `watchAdvertisements`.
- **CLI vs Runtime:** CLI is built on Runtime. If a user only wants a terminal workflow, use CLI guidance first.

## Unsupported or proprietary hardware

- For one project or private hardware, guide the user toward extending the base `Device` class locally.
- For upstream support, guide the user through adding the device to `packages/core` first, then wrappers and docs where
  needed.

High-level custom device outline:

1. Extend the base `Device` class from `@hangtime/grip-connect`.
2. Pass BLE filters, services, characteristics, and optional commands into `super(...)`.
3. Override `handleNotifications(value: DataView)` to parse incoming data and call `this.notifyCallback(...)`.
4. Implement any device-specific helpers such as `battery()`, `stream()`, `stop()`, `tare()`, or `led()` with `read()`
   and `write()` when the hardware supports them.

Offline starter scaffold:

```ts
import { Device } from "@hangtime/grip-connect"

export class MyCustomBoard extends Device {
  constructor() {
    super({
      filters: [{ namePrefix: "MY-BOARD" }],
      services: [
        {
          name: "Force Service",
          id: "force",
          uuid: "your-service-uuid",
          characteristics: [{ name: "Data", id: "rx", uuid: "your-characteristic-uuid" }],
        },
      ],
    })
  }

  override handleNotifications = (value: DataView): void => {
    if (!value?.buffer) return
    this.updateTimestamp()

    const current = value.getFloat32(0, true)
    this.peak = Math.max(this.peak, current)
    this.sum += current
    this.dataPointCount++
    this.mean = this.sum / this.dataPointCount

    this.notifyCallback(this.buildForceMeasurement(current))
  }
}
```

When the user needs writable commands, add a `tx` characteristic and optional `commands` to the `super(...)` config,
then implement helpers with `read()` or `write()`.

If internet access is available, the public custom-device guide lives at
`https://stevie-ray.github.io/hangtime-grip-connect/guide/custom-device`.
