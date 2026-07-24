# @hangtime/grip-connect-react-native

## 0.14.0

### Minor Changes

- 7e5beb8: Update Frez Dyno support to the official protocol v1 packet, command, coefficient API, tare, and
  device-timestamp contracts.

### Patch Changes

- Updated dependencies [7e5beb8]
  - @hangtime/grip-connect@0.14.0

## 0.13.4

### Patch Changes

- 618f721: Correct Frez Dyno's transport: use the `0x01`/`0x02` command bytes with acknowledged writes, parse its raw
  ADC packet counters, tare in software, and load calibration by serial before Bluetooth remote ID. Add an explicit
  serial override for browsers that cannot read the standard serial characteristic. The example app offers this recovery
  directly in the tare dialog and remembers the serial for later sessions.

  Add Frez Dyno to the Capacitor and React Native packages and examples. Native transports read the device serial and
  use it for automatic factory-calibration lookup before streaming.

- Updated dependencies [618f721]
  - @hangtime/grip-connect@0.13.4

## 0.13.3

### Patch Changes

- badbfa8: Enable duplicate WH-C06 advertisement scanning in React Native and only report connection success after
  manufacturer data is received.

## 0.13.1

### Patch Changes

- a61bbbb: Declare the Buffer polyfill as a runtime dependency for React Native device models.
- 68791aa: Export the missing `AuroraLedPlacement`, `IAurora`, and `IPB700BT` types (Capacitor previously exported no
  types at all), and harden React Native notification parsing by constructing `DataView`s with the Buffer's
  `byteOffset`/`byteLength`.
- Updated dependencies [034f0a9]
- Updated dependencies [68791aa]
- Updated dependencies [f671de3]
  - @hangtime/grip-connect@0.13.1

## 0.13.0

### Minor Changes

- 71d401e: Add CTS500 support to the runtime, Capacitor, and React Native packages, and expose it through the CLI device
  registry.

### Patch Changes

- Updated dependencies [aacc937]
  - @hangtime/grip-connect@0.13.0

## 0.12.0

### Minor Changes

- b2e4c32: Add Climbro device information reads, Progressor v2 calibration and reboot support, and new CLI device
  actions and interactive flows. Also includes connection robustness fixes such as case-insensitive UUID matching.

### Patch Changes

- Updated dependencies [b2e4c32]
  - @hangtime/grip-connect@0.12.0

## 0.10.9

### Patch Changes

- 9bb474b: Improve package publishing reliability by setting scoped packages to publish as public, normalizing the CLI
  bin path, and adding an npm auth preflight check in the release workflow.
- Updated dependencies [9bb474b]
  - @hangtime/grip-connect@0.10.9

## 0.10.7

### Patch Changes

- Release 0.10.7

  - Core: Add RFD interface (`RfdMode`, `RfdOptions`, `RFD_TIME_WINDOWS`)
  - Core: RFD callback fields and device model updates
  - CLI: RFD and stream/live refinements

- Updated dependencies
  - @hangtime/grip-connect@0.10.7

## 0.10.5

### Patch Changes

- Updated dependencies
  - @hangtime/grip-connect@0.10.5

## 0.10.2

### Patch Changes

- Updated dependencies
  - @hangtime/grip-connect@0.10.2

## 0.10.1

### Patch Changes

- Document kg/lbs (ForceUnit) in README, get-started, and Chart example. Clarify notify() default unit and optional
  "lbs" argument; add Units section to Chart example docs; fix README example comment.
- Updated dependencies
  - @hangtime/grip-connect@0.10.1

## 0.10.0

### Minor Changes

- Add runtime package for Node.js/Deno/Bun environments. Refactor CLI to use runtime adapters. Improve CLI with clean
  builds, engine requirements, consistent device keys, and expanded README. Fix release workflow to publish runtime
  package in correct order. Add build step to PR checks.

### Patch Changes

- Updated dependencies
  - @hangtime/grip-connect@0.10.0

## 0.9.1

### Patch Changes

- Add NSD PB-700BT Support
- Updated dependencies
  - @hangtime/grip-connect@0.9.1
