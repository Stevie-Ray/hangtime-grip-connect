# @hangtime/grip-connect

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
