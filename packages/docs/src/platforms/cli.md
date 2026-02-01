# CLI

Use `@hangtime/grip-connect-cli` for command-line tools on [Node.js](https://nodejs.org/), [Bun](https://bun.sh/), or
[Deno](https://deno.com/). It re-exports the same device classes and uses a Node-compatible BLE stack (e.g.
[webbluetooth](https://www.npmjs.com/package/webbluetooth)) so you can script connections and data from the terminal.
Best for: data logging, headless testing, and automation on a machine with Bluetooth.

## Install

### npm

Package on [npm](https://www.npmjs.com/package/@hangtime/grip-connect-cli).

::: code-group

```sh [npm]
npm install @hangtime/grip-connect-cli
```

:::

### JSR

The package is also published on [JSR](https://jsr.io/@hangtime/grip-connect-cli). Install from JSR with:

::: code-group

```sh [Deno]
deno add jsr:@hangtime/grip-connect-cli
```

```sh [pnpm]
pnpm i jsr:@hangtime/grip-connect-cli
```

```sh [Yarn]
yarn add jsr:@hangtime/grip-connect-cli
```

```sh [vlt]
vlt install jsr:@hangtime/grip-connect-cli
```

```sh [npm]
npx jsr add @hangtime/grip-connect-cli
```

```sh [Bun]
bunx jsr add @hangtime/grip-connect-cli
```

:::

## Usage

Import device classes from `@hangtime/grip-connect-cli` and use the same connect/stream/notify API as on web. Scripts
typically run under [Node.js](https://nodejs.org/), [Bun](https://bun.sh/), or [Deno](https://deno.com/) with
appropriate BLE support (physical machine with Bluetooth).

```ts
import { Motherboard } from "@hangtime/grip-connect-cli"

const device = new Motherboard()
device.notify((data) => console.log(data.massTotal))

await device.connect(
  async () => {
    console.log("Battery:", await device.battery())
    await device.stream(10000)
    device.disconnect()
  },
  (err) => console.error(err.message),
)
```

## Supported runtimes

- **Node.js**: Use a BLE binding supported by your environment (e.g. `webbluetooth` or native addon).
- **Bun**: Same API; ensure BLE is available on the host.
- **Deno**: Use `deno add @hangtime/grip-connect-cli` or `deno add jsr:@hangtime/grip-connect-cli` (from
  [JSR](https://jsr.io/@hangtime/grip-connect-cli)); run with permissions required by the BLE layer.

## Example

The monorepo includes a
[runtime example](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/runtime) that uses the CLI
package in a Node context. See that folder for a runnable script and dependencies.

## Next steps

- [Get started](/get-started) - Install (npm / [Bun](https://bun.sh/) / [Deno](https://deno.com/)) and minimal example.
- [Examples: Runtime](/examples/runtime) - Node script using the CLI package.
