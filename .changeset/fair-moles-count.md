---
"@hangtime/cli": patch
---

Refactor CLI `RunOptions` into grouped option objects (`stream`, `export`, `calibration`, `session`) for cleaner and
more scalable stream/session configuration.

Add configurable stream-session options in interactive flows:

- `Peak Force / MVC`: mode selection (`Single mode` / `Left/Right`)
- `Endurance`: duration and countdown
- `RFD`: countdown and new `Enable Left/Right mode` toggle
- `Repeaters`: countdown
- `Critical Force`: countdown

Update stream start prompts to support an `Options` path and show current option values directly in the menu label.
