---
title: Device interface
description: "Base IDevice: connect, notify, active, read, write, tare, download."
---

# Device interface

All devices implement the base `IDevice` interface. Device-specific classes (e.g. `Motherboard`, `Progressor`) extend
this with extra methods like `battery()`, `stream()`, and `led()`. For custom hardware, extend `Device` and define
`filters`, `services`, and optionally `commands` in the constructor.

## Properties

### filters

`BluetoothLEScanFilter[]` - Filters used to identify the device during scanning. Pass at least one of `name`,
`namePrefix`, or `services` so Web Bluetooth can find the device.

```ts
class MyBoard extends Device {
  constructor() {
    super({
      filters: [{ namePrefix: "MY-BOARD" }], // or { name: "Exact Name" } or { services: [uuid] }
      services: [
        /* ... */
      ],
    })
  }
}
```

### services

`Service[]` - Bluetooth services exposed by the device. Each service has `name`, `id`, `uuid`, and `characteristics`;
each characteristic has `name`, `id`, `uuid`. Use `service.id` and `characteristic.id` with [read](/api/methods/read)
and [write](/api/methods/write).

```ts
class MyBoard extends Device {
  constructor() {
    super({
      filters: [{ namePrefix: "MY-BOARD" }],
      services: [
        {
          name: "UART Transparent Service",
          id: "uart",
          uuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
          characteristics: [
            {
              name: "Read/Notify",
              id: "rx",
              uuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
            },
          ],
        },
      ],
    })
  }
}
```

### bluetooth

`BluetoothDevice | undefined` - Reference to the Web Bluetooth `BluetoothDevice` after a successful `connect()`.
`undefined` when disconnected.

```ts
class MyBoard extends Device {
  constructor() {
    super({
      filters: [{ namePrefix: "MY-BOARD" }],
      services: [
        /* ... */
      ],
    })
  }
}

await myBoard.connect(
  async () => {
    if (myBoard.bluetooth) {
      console.log("Connected to:", myBoard.bluetooth.name)
    }
  },
  (err) => console.error(err),
)
```

### commands

`Commands` - Used by devices that support write-based protocols, such as [Motherboard](/devices/motherboard) and
[Tindeq Progressor](/devices/progressor). It provides a standardized way of talking to devices: semantic command names
(e.g. `START_WEIGHT_MEAS`, `GET_BATTERY_VOLTAGE`) are mapped to device-specific payloads. Each device defines its own
values; pass `device.commands.COMMAND_NAME` as the message to [write](/api/methods/write).

```ts
class MyBoard extends Device {
  constructor() {
    super({
      filters: [{ namePrefix: "MY-BOARD" }],
      services: [
        {
          name: "Control Service",
          id: "control",
          uuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
          characteristics: [{ name: "Write", id: "tx", uuid: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" }],
        },
      ],
      commands: {
        START_MEASURE: "e",
        STOP_MEASURE: "f",
      },
    })
  }
}

// Use with write
await myBoard.write("control", "tx", myBoard.commands.START_MEASURE, 250, (data) => console.log(data))
```

See [Methods](/api/methods/) for connect, notify, read, write, tare, download and more; [Exports](/api/exports) for
built-in device classes; and [Adding a custom device](/guide/custom-device) for a complete example.
