# @hangtime/grip-connect-cli

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
