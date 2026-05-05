# Grip Connect - Aurora LED Boards

TypeScript port of [phil9l](https://github.com/phil9l)'s [blog](https://bazun.me/blog/kiterboard/) on how to write data
to Aurora-compatible LED boards such as Kilter, Aurora, So iLL, Tension, Decoy, Grasshopper, and Touchstone.

## Board data tables

BoardLib exports the Aurora app SQLite database as related tables. This example stores the relevant tables as JSON in
`src/data/<board>/`:

- `layouts` chooses the wall layout and points at a `product_id`.
- `product_sizes` describes render bounds for that product and gives the selected `product_size_id`.
- `sets` are the hold-set layers the UI can toggle.
- `product_sizes_layouts_sets` joins size + layout + set and gives the image filename for each rendered layer.
- `holes` stores physical hole coordinates for a product.
- `placements` joins layout + hole + set; `placement.id` is the ID used in route URLs.
- `leds` joins product size + hole and gives the Bluetooth LED `position`.
- `placement_roles` maps route `role_id` values to LED and screen colors for a product.

Route strings such as `p1083r15...` are resolved as `placement_id -> hole_id -> leds.position`, while `role_id` is
resolved through `placement_roles`. The resulting payload sent to Grip Connect uses `{ position, color }`.
