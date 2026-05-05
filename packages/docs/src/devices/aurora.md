---
title: Aurora LED Boards
description: "Kilter, Tension, Decoy, Touchstone, Grasshopper, and compatible Aurora LED boards: route display"
---

# Aurora LED Boards

The [Kilter Board](https://kilterboardapp.com/) (Aurora Climbing) and compatible LED system boards (Tension,
Grasshopper, Decoy, Touchstone, So iLL) display climb routes via LEDs. These boards are **LED-only** in Grip Connect:
you connect and send LED config via `led()`.

## Basic usage

1. **Connect** – Create an Aurora board device class such as `KilterBoard` or `TensionBoard`, then call
   `connect(onSuccess?, onError?)`. Requires a user gesture and secure context.
2. **Map holds to LED positions** – The board expects an array of `{ position, color }`. Each `position` is the **LED
   index** for that hold on the board (0-based). These indices are fixed per board model; you must get them from board
   data (see [Getting correct positions](#getting-correct-positions-for-a-board) below).
3. **Send LED config** – In the connect success callback, call `await device.led(placement)` with an array of
   `{ position: number, color: string }`. If your route data uses `role_id`, resolve it through your board
   `placement_roles` table first, then pass the resulting `led_color`. Empty array or `device.led()` turns LEDs off.

```ts
import { KilterBoard } from "@hangtime/grip-connect"

const device = new KilterBoard()

await device.connect(
  async () => {
    // Positions must come from your board's LED mapping (see below). These are illustrative only.
    const placement = [
      { position: 161, color: "00FF00" }, // start (green) at LED index 161
      { position: 162, color: "00FFFF" }, // middle (cyan)
      { position: 163, color: "FF00FF" }, // finish (magenta)
      { position: 164, color: "FFB600" }, // foot (orange)
    ]
    await device.led(placement)
    // Turn off: await device.led([]) or device.led()
  },
  (err) => console.error(err),
)
```

## Supported classes

All Aurora board classes use the same BLE transport and automatically detect API level 2 or 3 from the connected board
name. The subclasses select the board family naming used by your app; LED payloads use the same `{ position, color }`
shape for every Aurora-compatible board.

| Class              | Notes                     |
| ------------------ | ------------------------- |
| `AuroraBoard`      | Aurora Board family.      |
| `KilterBoard`      | Kilter Board family.      |
| `TensionBoard`     | Tension Board family.     |
| `DecoyBoard`       | Decoy Board family.       |
| `TouchstoneBoard`  | Touchstone Board family.  |
| `GrasshopperBoard` | Grasshopper Board family. |
| `SoiLLBoard`       | So iLL Board family.      |

### API level detection

Aurora LED kits use API level 3 on most newer boards, but older boards can use API level 2. API level 2 encodes 10-bit
LED positions and 64 colors; API level 3 encodes 16-bit positions and 256 colors. The library detects the API level from
the connected Bluetooth device name. Names ending in `@2` use API level 2, names ending in `@3` use API level 3, and
names without an API suffix follow the Aurora app behavior and use API level 2.

Aurora board names use this shape: alphanumeric name, optional `#` serial number, optional `@` API level. Examples:
`mykilterboard#2353@3`, `mykilterboard@2`, `mykilterboard`, and `mykilterboard#83727`.

```ts
import { KilterBoard } from "@hangtime/grip-connect"

const device = new KilterBoard()

await device.connect(async () => {
  await device.led([{ position: 161, color: "FF00FF" }])
})
```

## Getting correct positions for a board

The `position` in each `led()` entry is the **LED index** for that physical hold on the board. It is **not** arbitrary:
each board model has a fixed mapping from physical holes to LED indices. Using wrong positions will light the wrong
holds or do nothing.

The Kilter Board app gets this mapping from its backend. The app stores a local SQLite database with tables such as
**`holes`** (hole coordinates and id), **`leds`** (maps hole_id to the LED **position** used in the Bluetooth protocol),
**`placements`** (placement_id to hole_id), and **`placement_roles`** (role_id to LED color). Route layouts in the app
use a string format like `p1083r15p1117r15p1164r12...` (placement_id `p` + role_id `r`). To send a route to the board
you need to resolve each placement_id to the corresponding **LED position** (from the `leds` table for that hole).

Ways to get correct positions:

1. **BoardLib** – [BoardLib](https://github.com/lemeryfertitta/BoardLib) is a Python package that downloads and syncs
   the board’s SQLite database (holes, leds, placements, placement_roles, climbs, etc.) for Aurora Climbing boards
   (Kilter, Tension, and compatible boards). Install with `pip install boardlib`, then run
   `boardlib database <board_name> <database_path> --username <board_username>` to download and sync the database; use
   the `leds` table (hole_id → position) and `placements` / `holes` as needed. The database contains the same shared
   public data the app uses. See the [BoardLib README](https://github.com/lemeryfertitta/BoardLib) for database,
   logbook, and image commands.
2. **Board data from the app** – Sync or export from the Kilter Board app (e.g. SQLite at
   `/data/data/com.auroraclimbing.kilterboard/` on Android, or via the app’s sync API). Use the `leds` table (hole_id →
   position) and `placements` / `holes` as needed. See [KilterBoard](https://bazun.me/blog/kiterboard/) (Philipp Bazun)
   for the database schema and Bluetooth protocol.

## role_id and placement roles

Aurora apps use a **placement_roles** table to define standard hold roles and their LED colors. Grip Connect keeps the
Bluetooth encoder separate from the board database: `role_id` is app/database data, while `led()` takes the concrete
`color` that should be sent over Bluetooth.

| role_id | name   | full_name | led_color | Meaning            |
| ------- | ------ | --------- | --------- | ------------------ |
| 12      | start  | Start     | 00FF00    | Start hold (green) |
| 13      | middle | Middle    | 00FFFF    | Middle (cyan)      |
| 14      | finish | Finish    | FF00FF    | Finish (magenta)   |
| 15      | foot   | Foot Only | FFB600    | Foot only (orange) |

Resolve route roles before calling `led()`. API level 2 supports 64 colors and API level 3 supports 256 colors.

```ts
const role = placementRoles.find((entry) => entry.id === routeRoleId)

if (!role) {
  throw new Error(`Unknown route role: ${routeRoleId}`)
}

await board.led([{ position, color: role.led_color }])
```

## Methods

Aurora LED boards support all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify,
active, read, write, download). See [Device interface](/api/device-interface) for details.

### Device-specific

| Method        | Returns                          | Description                                                      |
| ------------- | -------------------------------- | ---------------------------------------------------------------- |
| `led(config)` | `Promise<number[] \| undefined>` | Set LEDs from an array of `{ position: number; color: string }`. |

## Resources

- [BoardLib](https://github.com/lemeryfertitta/BoardLib) (Python): Utilities for climbing board APIs. Download and sync
  the Kilter (and other Aurora) board SQLite database with
  `boardlib database <board_name> <path> --username <username>`; use the database for holes, leds, placements, and
  placement_roles. Also supports logbooks and images.
- [A web based Kilterboard application](https://tim.wants.coffee/posts/kilterboard-app/) (Tim / georift): Blog post on
  building [kilterboard.app](https://kilterboard.app), reverse engineering the Bluetooth protocol, and re-implementing
  with the Web Bluetooth API.
- [Kilterboard](https://www.bazun.me/blog/kiterboard/) (bazun.me): Database schema, sync API, and Bluetooth protocol for
  the Kilter Board app.

See [Examples: Aurora LED Boards](/examples/aurora) for a full demo and [API](/api/) for the shared interface.
