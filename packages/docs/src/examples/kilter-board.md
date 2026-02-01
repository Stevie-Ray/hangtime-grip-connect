---
title: Kilter Board
description: Display LED routes on a Kilter Board or compatible Aurora Climbing LED board using Grip Connect.
---

# Kilter Board example

Display LED routes on a Kilter Board (or compatible Aurora Climbing LED board) using Grip Connect.

This example used [phil9l](https://github.com/phil9l)'s [blog post](https://bazun.me/blog/kiterboard/) on how to write
data to the Kilter Board.

## Live demo

[Kilter Board](https://grip-connect-kilter-board.vercel.app/): try with a route query, e.g.  
`?route=p1083r15p1117r15p1164r12p1185r12p1233r13p1282r13p1303r13p1372r13p1392r14p1505r15`

## Source

[examples/kilter-board](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/kilter-board)

## Stack

- Vite + TypeScript
- `@hangtime/grip-connect`: `KilterBoard` class
- Device-specific `led(config)` with `{ position, role_id }[]` for hold highlighting

## Pattern

1. Connect to the Kilter Board via `KilterBoard` from `@hangtime/grip-connect`.
2. Parse route data (e.g. from URL or app state) into an array of `{ position, role_id }`.
3. Call `device.led(config)` with that array to light the holds.
4. Optionally stream force data with `notify()` for games or analytics.

See [Devices: Kilter Board](/devices/kilterboard) for the full `led()` API and position/role format.

## Resources

- [A web based Kilterboard application](https://tim.wants.coffee/posts/kilterboard-app/) (Tim / georift): Building
  kilterboard.app, reverse engineering the Bluetooth protocol, Web Bluetooth API.
- [Kilterboard](https://www.bazun.me/blog/kiterboard/) (bazun.me): Building for the Kilter Board.

## Run locally

From the repo root: `cd examples/kilter-board && npm install && npm run dev`. Connect to the board with a user gesture
over HTTPS or localhost.
