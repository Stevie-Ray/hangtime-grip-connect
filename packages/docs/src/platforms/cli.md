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

Non-interactive commands support `device` first so CLI flow matches interactive flow (pick device, then action):

```sh
npx @hangtime/cli progressor live
npx @hangtime/cli progressor peak-force-mvc --mode left-right
npx @hangtime/cli action progressor settings/system-info
```

### Command list

- `list`
- `live`
- `peak-force-mvc` (aliases: `peak-force`, `mvc`)
- `rfd`
- `endurance`
- `repeaters`
- `critical-force` (aliases: `critical`, `crictal-force`)
- `info`
- `download`
- `tare`
- `active`
- `action` (run/list interactive action paths)

### Help

```sh
npx @hangtime/cli --help
npx @hangtime/cli live --help
npx @hangtime/cli progressor live --help
npx @hangtime/cli action --help
```

### Interactive mode

```sh
npx @hangtime/cli
```

Pick a device, then pick an action. After each action the CLI loops back so you can run multiple actions on the same
connection. Choose **Disconnect** to return to the device picker.

### `list`

List all supported devices and their capabilities (stream, battery, tare, download, active).

```sh
npx @hangtime/cli list
```

### `live`

Live force output with real-time charting.

```sh
npx @hangtime/cli progressor live
npx @hangtime/cli progressor live --duration 10
```

| Flag             | Description                    | Default      |
| ---------------- | ------------------------------ | ------------ |
| `-d, --duration` | Duration in seconds (optional) | `indefinite` |

### `peak-force-mvc` (aliases: `peak-force`, `mvc`)

Run Peak Force / MVC test with optional torque and body-weight metrics.

```sh
npx @hangtime/cli progressor peak-force-mvc --mode left-right --include-torque --moment-arm-cm 35
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
npx @hangtime/cli progressor rfd --duration 5 --count-down-time 00:03 --threshold 0.5 --mode bilateral
```

| Flag                | Description                                          | Default  |
| ------------------- | ---------------------------------------------------- | -------- |
| `-d, --duration`    | Capture duration in seconds                          | `5`      |
| `--count-down-time` | Countdown before capture starts (`mm:ss` or seconds) | `3`      |
| `--threshold`       | Onset threshold in current force unit                | `0.5`    |
| `--mode`            | Session mode (`single` or `bilateral`)               | `single` |

### `endurance`

Run a time-based endurance test with optional left/right sequencing and MVC target zone.

```sh
npx @hangtime/cli progressor endurance --duration 00:30 --count-down-time 00:03 --mode bilateral --initial-side side.left --pause-between-sides 00:10 --levels-enabled --left-mvc 45 --right-mvc 43 --rest-level 40 --work-level 80
```

| Flag                    | Description                                                   | Default     |
| ----------------------- | ------------------------------------------------------------- | ----------- |
| `-d, --duration`        | Capture duration (`mm:ss` or seconds)                         | `00:30`     |
| `--count-down-time`     | Countdown before capture starts (`mm:ss` or seconds)          | `3`         |
| `--mode`                | Session mode (`single` or `bilateral`)                        | `single`    |
| `--initial-side`        | Initial side for bilateral mode (`side.left` or `side.right`) | `side.left` |
| `--pause-between-sides` | Pause between sides (`mm:ss` or seconds)                      | `10`        |
| `--levels-enabled`      | Enable target zone plotting                                   | `false`     |
| `--left-mvc`            | Left MVC in kg                                                | `0`         |
| `--right-mvc`           | Right MVC in kg                                               | `0`         |
| `--rest-level`          | Target zone minimum (% of MVC)                                | `40`        |
| `--work-level`          | Target zone maximum (% of MVC)                                | `80`        |

### `repeaters`

Run Repeaters protocol with configurable sets/reps timing, optional left/right sequencing, and optional MVC target
levels.

```sh
npx @hangtime/cli progressor repeaters --sets 3 --reps 12 --rep-dur 10 --rep-pause-dur 6 --set-pause-dur 08:00 --count-down-time 3 --mode bilateral --initial-side side.left --pause-between-sides 10 --levels-enabled --left-mvc 45 --right-mvc 43 --rest-level 40 --work-level 80
```

| Flag                    | Description                                                   | Default     |
| ----------------------- | ------------------------------------------------------------- | ----------- |
| `--sets`                | Number of sets                                                | `3`         |
| `--reps`                | Number of reps per set                                        | `12`        |
| `--rep-dur`             | Work duration per rep (`mm:ss` or seconds)                    | `10`        |
| `--rep-pause-dur`       | Rest duration between reps (`mm:ss` or seconds)               | `6`         |
| `--set-pause-dur`       | Pause duration between sets (`mm:ss` or seconds)              | `08:00`     |
| `--count-down-time`     | Countdown before protocol starts (`mm:ss` or seconds)         | `3`         |
| `--mode`                | Session mode (`single` or `bilateral`)                        | `single`    |
| `--initial-side`        | Initial side for bilateral mode (`side.left` or `side.right`) | `side.left` |
| `--pause-between-sides` | Pause between sides (`mm:ss` or seconds)                      | `10`        |
| `--levels-enabled`      | Enable target levels plotting                                 | `false`     |
| `--left-mvc`            | Left MVC in kg                                                | `0`         |
| `--right-mvc`           | Right MVC in kg                                               | `0`         |
| `--rest-level`          | Target levels minimum (% of MVC)                              | `40`        |
| `--work-level`          | Target levels maximum (% of MVC)                              | `80`        |

### `info`

Show all available device properties: battery, firmware, hardware, manufacturer, serial, model, certification, PnP ID,
software, system ID, humidity, and temperature. Only properties supported by the device are displayed.

```sh
npx @hangtime/cli entralpi info
```

### `download`

Export session data to a file.

```sh
npx @hangtime/cli forceboard download -f json -o ./exports
```

| Flag           | Description                                      | Default |
| -------------- | ------------------------------------------------ | ------- |
| `-f, --format` | Export format: `csv`, `json`, `xml`              | `csv`   |
| `-o, --output` | Output directory (creates and moves export file) |         |

### `tare`

Run tare (zero) calibration. A spinner indicates progress while the device collects baseline samples.

```sh
npx @hangtime/cli progressor tare           # default 5 s
npx @hangtime/cli progressor tare -d 10000  # 10 s
```

| Flag             | Description                   | Default |
| ---------------- | ----------------------------- | ------- |
| `-d, --duration` | Tare duration in milliseconds | `5000`  |

### `active`

Monitor activity status using the core `active()` callback. Prints timestamped status changes until Esc.

```sh
npx @hangtime/cli progressor active
npx @hangtime/cli progressor active -t 3.0 -d 1500
```

| Flag              | Description                       | Default |
| ----------------- | --------------------------------- | ------- |
| `-t, --threshold` | Force threshold in kg             | `2.5`   |
| `-d, --duration`  | Duration to confirm activity (ms) | `1000`  |

### `action`

Run any interactive action (including settings and device-specific actions) via a non-interactive path. If `path` is
omitted, the command lists all available action paths for the selected device.

```sh
npx @hangtime/cli action progressor
npx @hangtime/cli action progressor settings/system-info
npx @hangtime/cli action progressor settings/calibration/get-current-calibration-curve
npx @hangtime/cli action motherboard led --led-color green
```

| Flag                      | Description                                             | Default |
| ------------------------- | ------------------------------------------------------- | ------- |
| `-d, --duration`          | Duration for actions that support it                    |         |
| `--set-calibration-curve` | Progressor calibration curve (12-byte hex)              |         |
| `--save-calibration`      | Save calibration after add calibration point            | `false` |
| `--led-color`             | Motherboard LED color (`green`, `red`, `orange`, `off`) |         |
| `--threshold-lbs`         | ForceBoard threshold in lbs                             |         |

### `critical-force`

Run 24x (7s pull / 3s rest) critical force protocol.

```sh
npx @hangtime/cli progressor critical-force --count-down-time 00:03
```

| Flag                | Description                                           | Default |
| ------------------- | ----------------------------------------------------- | ------- |
| `--count-down-time` | Countdown before protocol starts (`mm:ss` or seconds) | `3`     |

## Measurements

- Interactive stream tests include a `Measurements` list item in `Pick an option`.
- Implemented tests (`Peak Force / MVC`, `Endurance`, `Repeaters`, `RFD`, `Critical Force`) ask
  `Save measurement? [y/N]` after completion.
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
npx @hangtime/cli progressor live --json | jq '.current'
npx @hangtime/cli progressor peak-force-mvc --json
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
