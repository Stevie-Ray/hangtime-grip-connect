# @hangtime/cli

## 0.10.10

### Patch Changes

- ac0a035: Refactor and improve interactive CLI workflows.
  - Reorganize interactive menu code under `menus/*` for clearer structure and single-file stream actions.
  - Add and stabilize Critical Force workflow behavior (countdowns, bright status labels, result view, and stop
    handling).
  - Improve RFD stop behavior to return cleanly to the menu on `Esc`.
  - Move `Tare` into `Settings` and add one-time per-connection auto-tare before first stream action.
  - Run Progressor `sleep()` automatically when disconnecting from interactive mode.

## 0.10.9

### Patch Changes

- 9bb474b: Improve package publishing reliability by setting scoped packages to publish as public, normalizing the CLI
  bin path, and adding an npm auth preflight check in the release workflow.
- Updated dependencies [9bb474b]
  - @hangtime/grip-connect-runtime@0.10.9

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

- Updated dependencies
  - @hangtime/grip-connect-runtime@0.10.7

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
