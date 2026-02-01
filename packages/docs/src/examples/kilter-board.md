---
title: Kilter Board
description: Display LED routes on a Kilter Board or compatible Aurora Climbing LED board.
---

# Kilter Board example

Display LED routes on a Kilter Board (or compatible Aurora Climbing LED board).

## Live demo

[Kilter Board](https://grip-connect-kilter-board.vercel.app/?route=p1083r15p1117r15p1164r12p1185r12p1233r13p1282r13p1303r13p1372r13p1392r14p1505r15)

## Source

[examples/kilter-board](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/kilter-board)

## Stack

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Pattern

1. Connect to the Kilter Board via `KilterBoard` from `@hangtime/grip-connect`.
2. Parse route data (e.g. from URL or app state) into an array of `{ position, role_id }`.
3. Call `device.led(config)` with that array to light the holds.

See [Devices: Kilter Board](/devices/kilterboard) for the full `led()` API, how to get correct positions, and role_id.

## Board data in this example

This example uses a **pre-built board data file** to resolve holds to LED positions. The data is a tab-separated array
with one row per hold in the form `[holes.x, holes.y, holes.id, leds.position, placement.id]`, the same structure you
get from the Kilter Board app database (or from [BoardLib](https://github.com/lemeryfertitta/BoardLib)): hole
coordinates, hole id, **LED position** (the index used in `led()`), and placement id. When building the `led()` config,
the example looks up each hold in this data to get `leds.position` and passes that as `position` to
`device.led([{ position, role_id }, ...])`. Route URLs use the layout format `p<placement_id>r<role_id>...`; the example
parses that and maps each placement_id to the corresponding LED position via the board data.

## Resources

- [A web based Kilterboard application](https://tim.wants.coffee/posts/kilterboard-app/) (Tim / georift): Building
  kilterboard.app, reverse engineering the Bluetooth protocol, Web Bluetooth API.
- [Kilterboard](https://www.bazun.me/blog/kiterboard/) (bazun.me): Building for the Kilter Board.
