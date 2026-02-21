---
"@hangtime/cli": minor
---

Improve interactive stream-test workflows and add persistent measurement tracking.

- Implement full `Peak Force / MVC` session flow (single or left/right) with live charting during capture and post-test
  summaries.
- Add optional Peak/MVC calculations for torque and body-weight comparison, with options sourced from test settings and
  unit behavior aligned to CLI settings.
- Add nested `Options` submenus across stream tests for clearer configuration UX.
- Add `Measurements` in stream test start menus and persist saved results per test to
  `~/.grip-connect/measurements.json`.
- Prompt to save measurements at the end of implemented tests (`Peak Force / MVC`, `RFD`, `Critical Force`).
- Add CLI startup splash rendering for interactive (non-JSON) runs.
- Align non-interactive test commands with interactive options by adding dedicated commands/flags for `peak-force-mvc`,
  `rfd`, and `critical-force`.
- Simplify streaming command surface to `live` in command registration and docs.
