# @hangtime/grip-connect

## 0.10.8

### Patch Changes

- 4c6fc9c: CLI: stream renamed to live with babar chart; tare for stream devices starts stream first
  - CLI: Add `live` command (alias `stream`) with real-time babar chart visualization
  - CLI: Tare command for stream devices (Progressor, ForceBoard, Motherboard) now starts a stream first, waits for
    data, then tares
  - CLI: Interactive mode gains Settings (Unit, Calibration, Errors), Live Data replaces Stream
  - CLI: Use readline keypress events for Esc-to-stop
  - Core: Progressor `tareScale()` removed; use shared `tare()` which requires active stream for hardware tare
  - Core: Add `clearTareOffset()` and `usesHardwareTare` to Progressor
  - Docs: Progressor example and tare docs updated

## 0.10.7

### Patch Changes

- Release 0.10.7
  - Core: Add RFD interface (`RfdMode`, `RfdOptions`, `RFD_TIME_WINDOWS`)
  - Core: RFD callback fields and device model updates
  - CLI: RFD and stream/live refinements

## 0.10.5

### Patch Changes

- CLI: stream renamed to live with babar chart; tare for stream devices starts stream first
  - CLI: Add `live` command (alias `stream`) with real-time babar chart visualization
  - CLI: Tare command for stream devices (Progressor, ForceBoard, Motherboard) now starts a stream first, waits for
    data, then tares
  - CLI: Interactive mode gains Settings (Unit, Calibration, Errors), Live Data replaces Stream
  - CLI: Use readline keypress events for Esc-to-stop
  - Core: Progressor `tareScale()` removed; use shared `tare()` which requires active stream for hardware tare
  - Core: Add `clearTareOffset()` and `usesHardwareTare` to Progressor
  - Docs: Progressor example and tare docs updated

## 0.10.4

### Patch Changes

- Progressor improvements: CLI streaming, interface updates, and documentation

## 0.10.3

### Patch Changes

- Progressor updates and CLI improvements

## 0.10.2

### Patch Changes

- Add ForceUnit `"n"` (newton) to `notify()`, `active()`, and CLI `--unit` option.
- Add missing Progressor commands: `START_PEAK_RFD_MEAS`, `START_PEAK_RFD_MEAS_SERIES`, `ADD_CALIBRATION_POINT`,
  `GET_CALIBRATION`; expose via `commands` and `write()`.
- Update device docs (Climbro, WH-C06, Kilter Board): clarify auto-streaming, remove incorrect `stream()`/`stop()` from
  examples and method tables.
- Add per-method API docs (connect, disconnect, notify, stream, stop, battery, led, tare, etc.).
- Bump Capacitor to 8.1 (@capacitor/filesystem ^8.1.1, example splash-screen ^8.0.1).

## 0.10.1

### Patch Changes

- Document kg/lbs (ForceUnit) in README, get-started, and Chart example. Clarify notify() default unit and optional
  "lbs" argument; add Units section to Chart example docs; fix README example comment.

## 0.10.0

### Minor Changes

- Add runtime package for Node.js/Deno/Bun environments. Refactor CLI to use runtime adapters. Improve CLI with clean
  builds, engine requirements, consistent device keys, and expanded README. Fix release workflow to publish runtime
  package in correct order. Add build step to PR checks.

## 0.9.1

### Patch Changes

- Add NSD PB-700BT Support
