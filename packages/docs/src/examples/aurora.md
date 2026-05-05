---
title: Aurora LED Boards
description: Display LED routes on a Kilter Board or compatible Aurora Climbing LED board.
---

# Aurora LED Boards example

Display LED routes on a Kilter Board (or compatible Aurora Climbing LED board).

## Live demo

[Aurora LED Boards](https://grip-connect-aurora.vercel.app/?route=p1083r15p1117r15p1164r12p1185r12p1233r13p1282r13p1303r13p1372r13p1392r14p1505r15)

## Source

[examples/aurora](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/aurora)

## Stack

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)

## Pattern

1. Connect to the Kilter Board via `KilterBoard` from `@hangtime/grip-connect`, or use the matching Aurora subclass for
   another board (`TensionBoard`, `DecoyBoard`, `TouchstoneBoard`, or `GrasshopperBoard`).
2. Parse route data (e.g. from URL or app state), then resolve each placement to `{ position, color }` with the board
   data tables.
3. Call `device.led(config)` with that array to light the holds.

See [Devices: Aurora LED Boards](/devices/aurora) for the full `led()` API, how to get correct positions, and how route
role IDs are resolved to colors.

## Board data in this example

This example keeps the relevant BoardLib SQLite tables as JSON under `examples/aurora/src/data/<board>/`. The tables are
related by IDs rather than by one flattened row, so the selected board, layout, size, and set determine which holds,
images, LEDs, and role colors apply.

| Table                        | Key relationship                                              | Used for                                                                 |
| ---------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `layouts`                    | `layouts.product_id` groups layouts by board product.         | User-selectable wall layout, such as Tension Board 2 Spray.              |
| `product_sizes`              | `product_sizes.product_id` matches the selected layout.       | Render bounds (`edge_*`) and available board sizes.                      |
| `sets`                       | Referenced by `placements.set_id` and join rows.              | Hold-set layers the user can toggle.                                     |
| `product_sizes_layouts_sets` | Joins `product_size_id`, `layout_id`, and `set_id`.           | Image filename for each visible size/layout/set layer.                   |
| `holes`                      | `holes.product_id` matches the selected layout product.       | Physical hole coordinates and mirroring data.                            |
| `placements`                 | Joins `layout_id`, `hole_id`, and `set_id`; `id` is route ID. | Maps route placements to physical holes for the selected layout and set. |
| `leds`                       | Joins `product_size_id` and `hole_id`.                        | Bluetooth LED `position` for a physical hole at the selected size.       |
| `placement_roles`            | `placement_roles.product_id` matches the selected layout.     | Maps `role_id` values to LED and screen colors.                          |

Route URLs use the app layout format `p<placement_id>r<role_id>...`. To light a route, the example resolves each
placement like this:

1. `placement_id` → `placements.hole_id` for the selected `layout_id` and enabled `set_id`s.
2. `hole_id` → `holes.x` / `holes.y` for rendering the clickable hold overlay.
3. `product_size_id` + `hole_id` → `leds.position`, which is the `position` used by the Bluetooth protocol.
4. `role_id` → `placement_roles.led_color`, filtered by the selected layout's `product_id`.

After that lookup, the example calls `device.led([{ position, color }, ...])`. Passing a direct color keeps the core
Bluetooth package independent from the bundled BoardLib data while preserving route URLs that use `role_id`.

## Resources

- [A web based Kilterboard application](https://tim.wants.coffee/posts/kilterboard-app/) (Tim / georift): Building
  kilterboard.app, reverse engineering the Bluetooth protocol, Web Bluetooth API.
- [Kilterboard](https://www.bazun.me/blog/kiterboard/) (bazun.me): Building for the Kilter Board.
