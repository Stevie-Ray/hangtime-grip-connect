---
title: Kilter Board
description: "Kilter Board and compatible LED boards: route display"
---

# Kilter Board

The [Kilter Board](https://kilterboardapp.com/) (Aurora Climbing) and compatible LED system boards (Tension,
Grasshopper, Decoy, Touchstone, So iLL) display climb routes via LEDs. The board is **LED-only**: you connect and send
LED config via `led()`. There is **no `notify()`**: the device does not stream force data; it only receives commands to
light holds.

## Basic usage

1. **Connect** – Create a `KilterBoard`, call `connect(onSuccess?, onError?)`. Requires a user gesture and secure
   context.
2. **Map holds to LED positions** – The board expects an array of `{ position, role_id }` or `{ position, color }`. Each
   `position` is the **LED index** for that hold on the board (0-based). These indices are fixed per board model; you
   must get them from board data (see [Getting correct positions](#getting-correct-positions-for-a-board) below).
3. **Send LED config** – In the connect success callback, call `await device.led(placement)` with an array of
   `{ position: number, role_id?: number, color?: string }`. Use `role_id` for standard route colors
   (start/middle/finish/foot) or `color` for a custom hex (e.g. `"00FF00"`). Empty array or `device.led()` turns LEDs
   off.

```ts
import { KilterBoard, KilterBoardPlacementRoles } from "@hangtime/grip-connect"

const device = new KilterBoard()

await device.connect(
  async () => {
    // Positions must come from your board's LED mapping (see below). These are illustrative only.
    const placement = [
      { position: 161, role_id: 12 }, // start (green) at LED index 161
      { position: 162, role_id: 13 }, // middle (cyan)
      { position: 163, role_id: 14 }, // finish (magenta)
      { position: 164, role_id: 15 }, // foot (orange)
    ]
    await device.led(placement)
    // Or use custom color: { position: 161, color: "FF0000" }
    // Turn off: await device.led([]) or device.led()
  },
  (err) => console.error(err),
)
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

## role_id and KilterBoardPlacementRoles

The Kilter Board app uses a **placement_roles** table to define standard hold roles and their LED colors. The library
ships a stripped copy of that table as **`KilterBoardPlacementRoles`** (exported from the Kilter Board App's database).
Use it to resolve `role_id` to LED color when building your `led()` config, or to show role names in the UI.

| role_id | name   | full_name | led_color | Meaning            |
| ------- | ------ | --------- | --------- | ------------------ |
| 12      | start  | Start     | 00FF00    | Start hold (green) |
| 13      | middle | Middle    | 00FFFF    | Middle (cyan)      |
| 14      | finish | Finish    | FF00FF    | Finish (magenta)   |
| 15      | foot   | Foot Only | FFB600    | Foot only (orange) |

When you pass `role_id` to `led()`, the board uses the corresponding `led_color`. You can also pass `color` (hex string)
for custom colors; the board supports 256 colors (3-bit R, 3-bit G, 2-bit B).

```ts
import { KilterBoardPlacementRoles } from "@hangtime/grip-connect"
```

## Methods

Kilter Board supports all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify, active,
read, write, download). See [Device interface](/api/device-interface) for details.

### Device-specific

| Method        | Returns                          | Description                                                                                                            |
| ------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `led(config)` | `Promise<number[] \| undefined>` | Set LEDs from an array of `{ position: number; role_id?: number; color?: string }`. Empty array or no arg to turn off. |

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

See [Examples: Kilter Board](/examples/kilter-board) for a full demo and [API](/api/) for the shared interface.
