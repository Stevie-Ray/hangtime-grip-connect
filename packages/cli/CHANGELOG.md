# @hangtime/cli

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

### Patch Changes

- @hangtime/grip-connect-runtime@0.10.5

## 0.10.4

### Patch Changes

- Progressor improvements: CLI streaming, interface updates, and documentation

## 0.10.2

### Patch Changes

- Add `--unit n` (newton) option for stream/watch output.
- Fix Ctrl+C handling in interactive mode and stream/watch.
- Add CLI support/capabilities sheet to README.
- Improve interactive mode, stream, and watch commands.
- Add Progressor info methods (tare, calibration, RFD) to `grip-connect info`.
- Updated dependencies
  - @hangtime/grip-connect-runtime@0.10.2

## 0.10.1

### Patch Changes

- Document kg/lbs (ForceUnit) in README, get-started, and Chart example. Clarify notify() default unit and optional
  "lbs" argument; add Units section to Chart example docs; fix README example comment.
- Updated dependencies
  - @hangtime/grip-connect-runtime@0.10.1

## 0.10.0

### Minor Changes

- Add runtime package for Node.js/Deno/Bun environments. Refactor CLI to use runtime adapters. Improve CLI with clean
  builds, engine requirements, consistent device keys, and expanded README. Fix release workflow to publish runtime
  package in correct order. Add build step to PR checks.

### Patch Changes

- Updated dependencies
  - @hangtime/grip-connect@0.10.0
  - @hangtime/grip-connect-runtime@0.10.0

## 0.9.1

### Patch Changes

- Add NSD PB-700BT Support
- Updated dependencies
  - @hangtime/grip-connect@0.9.1
