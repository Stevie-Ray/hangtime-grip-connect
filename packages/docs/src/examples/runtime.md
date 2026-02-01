---
title: Runtime (Node)
description:
  Use Grip Connect from Node.js, Bun, or Deno via the CLI package for scripts, data logging, or headless testing.
---

# Runtime (Node) example

Use Grip Connect from Node.js (or Bun/Deno) via the CLI package. Useful for scripts, data logging, or headless testing.

## Source

[examples/runtime](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/runtime)

## Stack

- Node.js (or Bun/Deno)
- `@hangtime/grip-connect-cli`: same device classes as core, with a Node-compatible BLE stack (e.g.
  [webbluetooth](https://www.npmjs.com/package/webbluetooth))

## Pattern

1. Import the device class from `@hangtime/grip-connect-cli`.
2. Create the device, set `notify()` (and optionally `active()`).
3. Call `connect(onSuccess, onError)` and inside the success callback use `stream()`, `battery()`, `download()`, etc.
4. Run the script on a machine with Bluetooth and a paired/supported device.

See [Platforms: CLI](/platforms/cli) for install and runtime notes.

## Run

From the repo root:

```sh
npm install
cd examples/runtime && node index.js
```

Or use the script defined in `examples/runtime/package.json`. Ensure Bluetooth is available and the device is in range.
