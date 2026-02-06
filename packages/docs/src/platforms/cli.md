# CLI

`@hangtime/grip-connect-cli` is a ready-made command-line tool for [Node.js](https://nodejs.org/),
[Bun](https://bun.sh/), or [Deno](https://deno.com/). It provides interactive mode, colored output, and commands for
streaming, watching, exporting, and inspecting devices -- all from the terminal. Built on the
[Runtime](/platforms/runtime) package. Best for: quick data checks, device testing, and interactive exploration.

## Install

### npm

Package on [npm](https://www.npmjs.com/package/@hangtime/grip-connect-cli).

::: code-group

```sh [npx]
npx @hangtime/grip-connect-cli
```

```sh [npm]
npm install -g @hangtime/grip-connect-cli
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

## Commands

After installing globally (`npm i -g @hangtime/grip-connect-cli`), the `grip-connect` binary is available. Running it
without a subcommand starts **interactive mode**.

### Interactive mode

```sh
grip-connect
```

Pick a device, then pick an action. After each action the CLI loops back so you can run multiple actions on the same
connection. Choose **Disconnect & exit** to stop.

### `list`

List all supported devices and their capabilities (stream, battery, tare, download, active).

```sh
grip-connect list
```

### `stream`

Stream force data for a fixed duration.

```sh
grip-connect stream progressor           # default 10 s
grip-connect stream progressor -d 30000  # 30 s
grip-connect stream progressor -w        # indefinite (alias for watch)
```

| Flag             | Description                     | Default |
| ---------------- | ------------------------------- | ------- |
| `-d, --duration` | Stream duration in milliseconds | `10000` |
| `-w, --watch`    | Stream indefinitely (Ctrl+C)    | `false` |

### `watch`

Stream indefinitely until Ctrl+C. Prints a session summary (peak, mean, samples, elapsed) on exit.

```sh
grip-connect watch motherboard
```

### `info`

Show all available device properties: battery, firmware, hardware, manufacturer, serial, model, certification, PnP ID,
software, system ID, humidity, and temperature. Only properties supported by the device are displayed.

```sh
grip-connect info entralpi
```

### `download`

Export session data to a file.

```sh
grip-connect download forceboard -f json
```

| Flag           | Description                         | Default |
| -------------- | ----------------------------------- | ------- |
| `-f, --format` | Export format: `csv`, `json`, `xml` | `csv`   |
| `-o, --output` | Output directory                    |         |

### `tare`

Run tare (zero) calibration. A spinner indicates progress while the device collects baseline samples.

```sh
grip-connect tare progressor           # default 5 s
grip-connect tare progressor -d 10000  # 10 s
```

| Flag             | Description                   | Default |
| ---------------- | ----------------------------- | ------- |
| `-d, --duration` | Tare duration in milliseconds | `5000`  |

### `active`

Monitor activity status using the core `active()` callback. Prints timestamped status changes until Ctrl+C.

```sh
grip-connect active progressor
grip-connect active progressor -t 3.0 -d 1500
```

| Flag              | Description                       | Default |
| ----------------- | --------------------------------- | ------- |
| `-t, --threshold` | Force threshold in kg             | `2.5`   |
| `-d, --duration`  | Duration to confirm activity (ms) | `1000`  |

## Global options

| Flag            | Description                                      |
| --------------- | ------------------------------------------------ |
| `--json`        | Output newline-delimited JSON (machine-readable) |
| `--no-color`    | Disable colored terminal output                  |
| `-V, --version` | Print version number                             |
| `-h, --help`    | Display help                                     |

## JSON mode

Pass `--json` to any command for machine-readable output. For `stream` and `watch` this produces newline-delimited JSON
(one measurement per line). For `list` and `info` it outputs a single JSON object.

```sh
grip-connect stream progressor --json | jq '.current'
grip-connect list --json
```

## Programmatic usage

Looking for a programmatic library to import device classes in your own scripts? See the [Runtime](/platforms/runtime)
package (`@hangtime/grip-connect-runtime`), which provides the same API as the web library for
[Node.js](https://nodejs.org/), [Bun](https://bun.sh/), and [Deno](https://deno.com/).

## Next steps

- [Runtime](/platforms/runtime) - Programmatic library for Node.js, Bun, and Deno scripts.
- [Get started](/get-started) - Install and minimal example.
- [Examples: Runtime](/examples/runtime) - Runnable Node.js script using the Runtime package.
