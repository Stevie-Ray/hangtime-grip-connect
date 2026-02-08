---
title: Runtime
description: Use @hangtime/grip-connect-runtime from Node.js, Bun, or Deno for scripting, data logging, and automation.
---

# Runtime

Use `@hangtime/grip-connect-runtime` as a programmatic adapter for [Node.js](https://nodejs.org/),
[Bun](https://bun.sh/), or [Deno](https://deno.com/). It wraps the core device classes with a Node-compatible BLE stack
([webbluetooth](https://www.npmjs.com/package/webbluetooth)) and a filesystem-based `download()` so you can connect,
stream, and export data from scripts and backend services. Best for: data logging, automation, headless testing, and
building your own tools on top of the library.

::: tip Runtime vs CLI

**Runtime** is a programmatic library -- import device classes and write your own logic. **[CLI](/platforms/cli)** is a
ready-made command-line tool (built on Runtime) with interactive mode, colored output, and commands like `stream`,
`watch`, `info`, and `tare`. Use CLI if you want a tool; use Runtime if you want a library.

:::

## Install

### npm

Package on [npm](https://www.npmjs.com/package/@hangtime/grip-connect-runtime).

::: code-group

```sh [npm]
npm install @hangtime/grip-connect-runtime
```

```sh [pnpm]
pnpm add @hangtime/grip-connect-runtime
```

```sh [Yarn]
yarn add @hangtime/grip-connect-runtime
```

```sh [Bun]
bun add @hangtime/grip-connect-runtime
```

:::

### JSR

The package is also published on [JSR](https://jsr.io/@hangtime/grip-connect-runtime). Install from JSR with:

::: code-group

```sh [Deno]
deno add jsr:@hangtime/grip-connect-runtime
```

```sh [npm]
npx jsr add @hangtime/grip-connect-runtime
```

```sh [Bun]
bunx jsr add @hangtime/grip-connect-runtime
```

:::

## Usage

Import device classes from `@hangtime/grip-connect-runtime` and use the same connect/stream/notify API as on web. The
only difference is that BLE is provided by the `webbluetooth` polyfill and `download()` writes files to disk instead of
triggering a browser download.

```ts
import { Progressor } from "@hangtime/grip-connect-runtime"

const device = new Progressor()

// Subscribe to real-time force data
device.notify((data) => {
  console.log(`${data.current.toFixed(2)} ${data.unit}  Peak: ${data.peak.toFixed(2)}`)
})

// Optional: detect when user is pulling
device.active((isActive) => console.log(isActive ? "Active" : "Inactive"), {
  threshold: 2.5,
  duration: 1000,
})

// Connect and stream
await device.connect(
  async () => {
    console.log("Battery:", await device.battery())
    console.log("Firmware:", await device.firmware())

    device.tare(5000) // optional: zero calibration

    await device.stream(30000) // stream for 30 seconds
    await device.stop()

    device.download("json") // writes data-export-*.json to disk
    device.disconnect()
  },
  (err) => console.error("Connection failed:", err.message),
)
```

## Exported classes

The runtime package re-exports all device classes from the core library with Node-compatible overrides:

| Class           | Device                                                                                                                                       |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Climbro`       | Climbro                                                                                                                                      |
| `Entralpi`      | Entralpi                                                                                                                                     |
| `ForceBoard`    | PitchSix Force Board                                                                                                                         |
| `KilterBoard`   | Kilter Board                                                                                                                                 |
| `Motherboard`   | Griptonite Motherboard                                                                                                                       |
| `mySmartBoard`  | mySmartBoard                                                                                                                                 |
| `PB700BT`       | NSD PB-700BT                                                                                                                                 |
| `Progressor`    | Tindeq Progressor                                                                                                                            |
| `SmartBoardPro` | SmartBoard Pro                                                                                                                               |
| `WHC06`         | Weiheng WH-C06 — **unsupported** (requires `watchAdvertisements`, not available in [webbluetooth](https://github.com/thegecko/webbluetooth)) |

All classes share the same [device interface](/api/device-interface) and support the same methods as their web
counterparts. See [Devices](/devices/) for device-specific methods.

## Supported platforms

The runtime uses [webbluetooth](https://github.com/thegecko/webbluetooth) for Node-compatible BLE. Prebuilt binaries
support:

| OS            | x86 | x64 | arm64 |
| ------------- | --- | --- | ----- |
| Windows       | ✓   | ✓   | —     |
| macOS         | —   | ✓   | ✓     |
| Linux (glibc) | —   | ✓   | ✓     |

## Supported runtimes

- **Node.js**: Requires a machine with Bluetooth. The `webbluetooth` package provides the BLE layer.
- **Bun**: Same API as Node.js; ensure BLE is available on the host.
- **Deno**: Use `deno add jsr:@hangtime/grip-connect-runtime` and run with permissions required by the BLE layer.

## Example

The monorepo includes a
[runtime example](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/runtime) that uses this
package. Run it from the repo root:

```sh
npm install
npm run start --workspace ./examples/runtime
```

Ensure Bluetooth is available and the device is in range.

## Next steps

- [Get started](/get-started) - Install and minimal example.
- [CLI](/platforms/cli) - Ready-made command-line tool built on this package.
- [API](/api/) - Full device interface and data types.
- [Examples: Runtime](/examples/runtime) - Runnable Node.js script.
