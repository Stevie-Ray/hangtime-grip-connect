---
"@hangtime/cli": patch
---

Refactor and improve interactive CLI workflows.

- Reorganize interactive menu code under `menus/*` for clearer structure and single-file stream actions.
- Add and stabilize Critical Force workflow behavior (countdowns, bright status labels, result view, and stop handling).
- Improve RFD stop behavior to return cleanly to the menu on `Esc`.
- Move `Tare` into `Settings` and add one-time per-connection auto-tare before first stream action.
- Run Progressor `sleep()` automatically when disconnecting from interactive mode.
