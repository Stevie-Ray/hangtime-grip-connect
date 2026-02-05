---
title: Runtime (Node)
description: Use the Runtime package from Node.js, Bun, or Deno for scripts, data logging, or headless testing.
---

# Runtime (Node) example

Use the Runtime package (`@hangtime/grip-connect-runtime`) from [Node.js](https://nodejs.org/), [Bun](https://bun.sh/),
or [Deno](https://deno.com/) for scripts, data logging, or headless testing.

## Source

[examples/runtime](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/runtime)

## Stack

- [Node.js](https://nodejs.org/), [Bun](https://bun.sh/), or [Deno](https://deno.com/)
- [@hangtime/grip-connect-runtime](https://www.npmjs.com/package/@hangtime/grip-connect-runtime)
- [webbluetooth](https://www.npmjs.com/package/webbluetooth)

## Pattern

1. Import the device class from `@hangtime/grip-connect-runtime`.
2. Create the device, set `notify()` (and optionally `active()`).
3. Call `connect(onSuccess, onError)` and inside the success callback use `stream()`, `battery()`, `download()`, etc.
4. Run the script on a machine with Bluetooth and a paired/supported device.

See [Platforms: Runtime](/platforms/runtime) for install and usage notes, or [Platforms: CLI](/platforms/cli) for the
ready-made command-line tool.

## Run

From the repo root:

```sh
npm install
npm run start --workspace ./examples/runtime
```

Ensure Bluetooth is available and the device is in range.
