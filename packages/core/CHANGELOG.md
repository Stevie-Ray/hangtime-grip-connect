# @hangtime/grip-connect

## 0.14.0

### Minor Changes

- 7e5beb8: Update Frez Dyno support to the official protocol v1 packet, command, coefficient API, tare, and
  device-timestamp contracts.

## 0.13.4

### Patch Changes

- 618f721: Correct Frez Dyno's transport: use the `0x01`/`0x02` command bytes with acknowledged writes, parse its raw
  ADC packet counters, tare in software, and load calibration by serial before Bluetooth remote ID. Add an explicit
  serial override for browsers that cannot read the standard serial characteristic. The example app offers this recovery
  directly in the tare dialog and remembers the serial for later sessions.

  Add Frez Dyno to the Capacitor and React Native packages and examples. Native transports read the device serial and
  use it for automatic factory-calibration lookup before streaming.

## 0.13.2

### Patch Changes

- a68278e: Improve pull-up detection with force-phase output, bodyweight-normalized impulse metrics, and better
  unloaded-noise and dismount filtering.
- 1910e0e: Avoid sending null Frez Dyno serial numbers to the remote calibration lookup.
- 3b54f27: Add a Motherboard pull-up callback helper that reports the running rep count from live force streams.

## 0.13.1

### Patch Changes

- 034f0a9: Add Aurora LED board classes with color-based LED payload encoding, API level 2 support, and automatic V2/V3
  selection from the connected board name.
- 68791aa: Fix session statistics correctness: track real per-zone minimums for Motherboard distribution measurements
  instead of deriving them from peak/current, reset session stats (peak/min/mean/sum) when Motherboard, ForceBoard, and
  CTS500 start a new stream, make `activityCheck` synchronous, add the missing `IPB700BT` interface, and fix a
  service-name typo in ForceBoard.
- f671de3: Speed up Aurora LED board frame updates by writing intermediate BLE chunks without response.

## 0.13.0

### Minor Changes

- aacc937: Add CTS500 by jlyscales across core, docs, and the example app registration.

## 0.12.0

### Minor Changes

- b2e4c32: Add Climbro device information reads, Progressor v2 calibration and reboot support, and new CLI device
  actions and interactive flows. Also includes connection robustness fixes such as case-insensitive UUID matching.

## 0.10.9

### Patch Changes

- 9bb474b: Improve package publishing reliability by setting scoped packages to publish as public, normalizing the CLI
  bin path, and adding an npm auth preflight check in the release workflow.

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
