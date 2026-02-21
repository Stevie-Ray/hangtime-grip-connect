# CLI

`@hangtime/cli` is a ready-made command-line tool for [Node.js](https://nodejs.org/), [Bun](https://bun.sh/), or
[Deno](https://deno.com/). It provides interactive mode, colored output, and commands for live testing, exporting, and
inspecting devices -- all from the terminal. Built on the [Runtime](/platforms/runtime) package. Best for: quick data
checks, device testing, and interactive exploration.

## Install

### npm

Package on [npm](https://www.npmjs.com/package/@hangtime/cli).

::: code-group

```sh [npx]
npx @hangtime/cli
```

```sh [npm]
npm install -g @hangtime/cli
```

:::

### JSR

The package is also published on [JSR](https://jsr.io/@hangtime/cli). Install from JSR with:

::: code-group

```sh [Deno]
deno add jsr:@hangtime/cli
```

```sh [pnpm]
pnpm i jsr:@hangtime/cli
```

```sh [Yarn]
yarn add jsr:@hangtime/cli
```

```sh [vlt]
vlt install jsr:@hangtime/cli
```

```sh [npm]
npx jsr add @hangtime/cli
```

```sh [Bun]
bunx jsr add @hangtime/cli
```

:::

## Commands

After installing globally (`npm i -g @hangtime/cli`), the `grip-connect` binary is available. Running it without a
subcommand starts **interactive mode**.

### Interactive mode

```sh
npx @hangtime/cli
```

Pick a device, then pick an action. After each action the CLI loops back so you can run multiple actions on the same
connection. Choose **Disconnect & exit** to stop.

### `list`

List all supported devices and their capabilities (stream, battery, tare, download, active).

```sh
npx @hangtime/cli list
```

### `live`

Live force output with real-time charting.

```sh
npx @hangtime/cli live progressor
npx @hangtime/cli live progressor --duration 10
```

| Flag             | Description                    | Default      |
| ---------------- | ------------------------------ | ------------ |
| `-d, --duration` | Duration in seconds (optional) | `indefinite` |

### `peak-force-mvc` (aliases: `peak-force`, `mvc`)

Run Peak Force / MVC test with optional torque and body-weight metrics.

```sh
npx @hangtime/cli peak-force-mvc progressor --mode left-right --include-torque --moment-arm-cm 35
```

| Flag                               | Description                                  | Default  |
| ---------------------------------- | -------------------------------------------- | -------- |
| `--mode <single\|left-right>`      | Test mode                                    | `single` |
| `--include-torque`                 | Include torque calculation                   | `false`  |
| `--moment-arm-cm <cm>`             | Moment arm length in centimeters             | `35`     |
| `--include-body-weight-comparison` | Include body-weight comparison               | `false`  |
| `--body-weight <value>`            | Body weight (uses current CLI unit behavior) | `70`     |

### `rfd`

Run Rate of Force Development test.

```sh
npx @hangtime/cli rfd progressor --duration 5 --countdown 3 --threshold 0.5 --left-right
```

| Flag             | Description                               | Default |
| ---------------- | ----------------------------------------- | ------- |
| `-d, --duration` | Capture duration in seconds               | `5`     |
| `--countdown`    | Countdown before capture starts (seconds) | `3`     |
| `--threshold`    | Onset threshold in current force unit     | `0.5`   |
| `--left-right`   | Enable Left/Right mode                    | `false` |

### `info`

Show all available device properties: battery, firmware, hardware, manufacturer, serial, model, certification, PnP ID,
software, system ID, humidity, and temperature. Only properties supported by the device are displayed.

```sh
npx @hangtime/cli info entralpi
```

### `download`

Export session data to a file.

```sh
npx @hangtime/cli download forceboard -f json
```

| Flag           | Description                         | Default |
| -------------- | ----------------------------------- | ------- |
| `-f, --format` | Export format: `csv`, `json`, `xml` | `csv`   |
| `-o, --output` | Output directory                    |         |

### `tare`

Run tare (zero) calibration. A spinner indicates progress while the device collects baseline samples.

```sh
npx @hangtime/cli tare progressor           # default 5 s
npx @hangtime/cli tare progressor -d 10000  # 10 s
```

| Flag             | Description                   | Default |
| ---------------- | ----------------------------- | ------- |
| `-d, --duration` | Tare duration in milliseconds | `5000`  |

### `active`

Monitor activity status using the core `active()` callback. Prints timestamped status changes until Ctrl+C.

```sh
npx @hangtime/cli active progressor
npx @hangtime/cli active progressor -t 3.0 -d 1500
```

| Flag              | Description                       | Default |
| ----------------- | --------------------------------- | ------- |
| `-t, --threshold` | Force threshold in kg             | `2.5`   |
| `-d, --duration`  | Duration to confirm activity (ms) | `1000`  |

### `critical-force`

Run 24x (7s pull / 3s rest) critical force protocol.

```sh
npx @hangtime/cli critical-force progressor --countdown 3
```

| Flag          | Description                                | Default |
| ------------- | ------------------------------------------ | ------- |
| `--countdown` | Countdown before protocol starts (seconds) | `3`     |

## Measurements

- Interactive stream tests include a `Measurements` list item in `Pick an option`.
- Implemented tests (`Peak Force / MVC`, `RFD`, `Critical Force`) ask `Save measurement? [y/N]` after completion.
- Saved records are persisted at `~/.grip-connect/measurements.json`.

## Global options

| Flag            | Description                                      |
| --------------- | ------------------------------------------------ |
| `--json`        | Output newline-delimited JSON (machine-readable) |
| `--no-color`    | Disable colored terminal output                  |
| `-u, --unit`    | Force unit: `kg`, `lbs`, or `n`                  |
| `-V, --version` | Print version number                             |
| `-h, --help`    | Display help                                     |

## JSON mode

Pass `--json` to any command for machine-readable output. For `live` and test commands, this produces newline-delimited
JSON (one measurement per line). For `list` and `info` it outputs a single JSON object.

```sh
npx @hangtime/cli live progressor --json | jq '.current'
npx @hangtime/cli peak-force-mvc progressor --json
npx @hangtime/cli list --json
```

## Supported platforms

The CLI uses [webbluetooth](https://github.com/thegecko/webbluetooth) for Node.js BLE. Prebuilt binaries support:

| OS            | x86 | x64 | arm64 |
| ------------- | --- | --- | ----- |
| Windows       | ✓   | ✓   | -     |
| macOS         | -   | ✓   | ✓     |
| Linux (glibc) | -   | ✓   | ✓     |

**WH-C06** is not supported in the CLI or Runtime: the device requires `watchAdvertisements()`, which is
[unsupported in the webbluetooth adapter](https://github.com/thegecko/webbluetooth#implementation-status).

## Programmatic usage

Looking for a programmatic library to import device classes in your own scripts? See the [Runtime](/platforms/runtime)
package (`@hangtime/grip-connect-runtime`), which provides the same API as the web library for
[Node.js](https://nodejs.org/), [Bun](https://bun.sh/), and [Deno](https://deno.com/).

## Next steps

- [Runtime](/platforms/runtime) - Programmatic library for Node.js, Bun, and Deno scripts.
- [Get started](/get-started) - Install and minimal example.
- [Examples: Runtime](/examples/runtime) - Runnable Node.js script using the Runtime package.
