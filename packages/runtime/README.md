# Grip Connect - Runtime

A runtime adapter for [Node.js](https://nodejs.org/), [Bun](https://bun.sh/), and [Deno](https://deno.com/) that wraps
`@hangtime/grip-connect` with a Node-compatible BLE stack ([webbluetooth](https://www.npmjs.com/package/webbluetooth))
and filesystem-based `download()`. Use it to script connections, stream force data, and export sessions from the
terminal.

## When to use

- **Scripting & automation** -- write custom connect/stream/export workflows in TypeScript.
- **Data logging** -- pipe real-time force data into files, databases, or other tools.
- **Headless testing** -- run device tests on CI or remote machines with Bluetooth.

For a ready-made command-line tool, see [@hangtime/cli](https://www.npmjs.com/package/@hangtime/cli).

## Install

The package is available on [npm](https://www.npmjs.com/package/@hangtime/grip-connect-runtime) and
[JSR](https://jsr.io/@hangtime/grip-connect-runtime).

```sh
npm install @hangtime/grip-connect-runtime
```

## Usage

```ts
import { Progressor } from "@hangtime/grip-connect-runtime"

const device = new Progressor()

device.notify((data) => console.log(data.current))

await device.connect(
  async () => {
    console.log("Battery:", await device.battery())
    await device.stream(10000)
    device.disconnect()
  },
  (err) => console.error(err.message),
)
```

## Supported Platforms

The runtime uses [webbluetooth](https://github.com/thegecko/webbluetooth) for Node-compatible BLE. Prebuilt binaries
support:

| OS            | x86 | x64 | arm64 |
| ------------- | --- | --- | ----- |
| Windows       | ✓   | ✓   | —     |
| macOS         | —   | ✓   | ✓     |
| Linux (glibc) | —   | ✓   | ✓     |

## Unsupported devices

**WH-C06** — Not supported in the runtime. The device relies on `watchAdvertisements()`, which is
[unsupported in the webbluetooth adapter](https://github.com/thegecko/webbluetooth#implementation-status).

## Documentation

- [Runtime platform docs](https://stevie-ray.github.io/hangtime-grip-connect/platforms/runtime)
- [Full documentation](https://stevie-ray.github.io/hangtime-grip-connect/)
