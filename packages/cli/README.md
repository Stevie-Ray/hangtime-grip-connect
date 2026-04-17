# Grip Connect - CLI

A Command Line Interface for connecting to grip strength training devices via Bluetooth, powered by
`@hangtime/grip-connect` and `webbluetooth`.

## Quick Start

```sh
npx @hangtime/cli
```

This launches interactive mode: pick a device, connect, choose actions, then disconnect to return to the device picker
(or run another action).

If you see “could not determine executable to run”, your environment may be using an older cached or local version—try
`npx @hangtime/cli@latest` or pin a specific version.

### Commands (with npx)

```sh
# Interactive mode (pick device and actions)
npx @hangtime/cli

# List all supported devices
npx @hangtime/cli list

# Non-interactive flow matches interactive flow: device first, then action
npx @hangtime/cli progressor live
npx @hangtime/cli progressor peak-force-mvc --mode left-right
npx @hangtime/cli action progressor settings/system-info

# Live Data: raw force visualised in real-time with chart (Esc to stop; use `tare` before live to zero)
npx @hangtime/cli progressor live

# Live Data for a fixed duration (e.g. 10 seconds)
npx @hangtime/cli progressor live --duration 10

# Critical Force: 24 reps of 7s pull + 3s rest with live chart and CF/W' summary
npx @hangtime/cli progressor critical-force

# Peak Force / MVC (aliases: peak-force, mvc)
npx @hangtime/cli progressor peak-force-mvc --mode left-right --include-torque --moment-arm-cm 35

# RFD test
npx @hangtime/cli progressor rfd --duration 5 --count-down-time 00:03 --threshold 0.5 --mode bilateral

# Endurance test
npx @hangtime/cli progressor endurance --duration 00:30 --count-down-time 00:03 --mode bilateral --initial-side side.left --pause-between-sides 00:10 --levels-enabled --left-mvc 45 --right-mvc 43 --rest-level 40 --work-level 80

# Repeaters test
npx @hangtime/cli progressor repeaters --sets 3 --reps 12 --rep-dur 10 --rep-pause-dur 6 --set-pause-dur 08:00 --count-down-time 3 --mode bilateral --initial-side side.left --pause-between-sides 10 --levels-enabled --left-mvc 45 --right-mvc 43 --rest-level 40 --work-level 80

# Use lbs for live/test output (default is kg)
npx @hangtime/cli forceboard live --unit lbs

# Show device info (battery, firmware, device ID, calibration, etc.)
npx @hangtime/cli entralpi info

# Export session data
npx @hangtime/cli forceboard download --format csv --output ./exports

# Run tare (zero) calibration. For stream devices (Progressor, ForceBoard, Motherboard),
# tare automatically starts a stream first since tare requires live data.
npx @hangtime/cli motherboard tare --duration 5000

# Monitor activity status
npx @hangtime/cli progressor active --threshold 2.5
```

## Optional: Global install

```sh
npm install -g @hangtime/cli
```

Then use the `grip-connect` command anywhere:

```sh
# Interactive mode (pick device and actions)
grip-connect

# List all supported devices
grip-connect list

# Live Data: raw force visualised in real-time (Esc to stop; use tare before live to zero)
grip-connect progressor live

# Live Data for a fixed duration (e.g. 10 seconds)
grip-connect progressor live --duration 10

# Critical Force: 24 reps of 7s pull + 3s rest with live chart and CF/W' summary
grip-connect progressor critical-force

# Peak Force / MVC
grip-connect progressor peak-force-mvc --mode single

# RFD test
grip-connect progressor rfd --duration 5 --threshold 0.5

# Show device info (battery, firmware, device ID, calibration, etc.)
grip-connect entralpi info

# Export session data
grip-connect forceboard download --format csv --output ./exports

# Run tare (zero) calibration (stream devices: auto-starts stream first)
grip-connect motherboard tare --duration 5000

# Monitor activity status
grip-connect progressor active --threshold 2.5
```

## Supported Devices

| Key            | Name           | Capabilities                                                                                                             |
| -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| climbro        | Climbro        | battery, tare, download, active                                                                                          |
| cts500         | CTS500         | stream, battery, tare, download, active                                                                                  |
| entralpi       | Entralpi       | battery, tare, download, active                                                                                          |
| forceboard     | ForceBoard     | stream, battery, tare, download, active                                                                                  |
| motherboard    | Motherboard    | stream, battery, tare, download, active                                                                                  |
| mysmartboard   | mySmartBoard   | tare, download, active                                                                                                   |
| pb-700bt       | PB-700BT       | battery, tare, download, active                                                                                          |
| progressor     | Progressor     | stream, battery, tare, download, active                                                                                  |
| smartboard-pro | SmartBoard Pro | tare, download, active                                                                                                   |
| wh-c06         | WH-C06         | **Unsupported** — `watchAdvertisements` not available in Node ([webbluetooth](https://github.com/thegecko/webbluetooth)) |

## Supported Platforms

The CLI uses [webbluetooth](https://github.com/thegecko/webbluetooth) for Node.js BLE. Prebuilt binaries support:

| OS            | x86 | x64 | arm64 |
| ------------- | --- | --- | ----- |
| Windows       | ✓   | ✓   | —     |
| macOS         | —   | ✓   | ✓     |
| Linux (glibc) | —   | ✓   | ✓     |

## Options

```sh
npx @hangtime/cli --json          # Output newline-delimited JSON
npx @hangtime/cli --no-color      # Disable colored output
npx @hangtime/cli --unit lbs      # Force unit for test output (default: kg; -u shorthand)
npx @hangtime/cli --version       # Show version
npx @hangtime/cli --help          # Show help
npx @hangtime/cli live --help     # Show help for a command
npx @hangtime/cli progressor live --help  # Device-first help
npx @hangtime/cli action --help   # Show help for action paths
```

## Command List

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

## Test Commands

### `peak-force-mvc [device]` (aliases: `peak-force`, `mvc`)

```sh
npx @hangtime/cli progressor peak-force-mvc --mode left-right --include-torque --moment-arm-cm 35
```

- `--mode <single|left-right>`
- `--include-torque`
- `--moment-arm-cm <cm>`
- `--include-body-weight-comparison`
- `--body-weight <value>` (uses current `--unit` behavior)

### `rfd [device]`

```sh
npx @hangtime/cli progressor rfd --duration 5 --count-down-time 00:03 --threshold 0.5 --mode bilateral
```

- `-d, --duration <seconds>`
- `--count-down-time <time>` (`mm:ss` or seconds)
- `--threshold <value>`
- `--mode <single|bilateral>`

### `endurance [device]`

```sh
npx @hangtime/cli progressor endurance --duration 00:30 --count-down-time 00:03 --mode bilateral --initial-side side.left --pause-between-sides 00:10 --levels-enabled --left-mvc 45 --right-mvc 43 --rest-level 40 --work-level 80
```

- `-d, --duration <time>` (`mm:ss` or seconds)
- `--count-down-time <time>` (`mm:ss` or seconds)
- `--mode <single|bilateral>`
- `--initial-side <side.left|side.right>`
- `--pause-between-sides <time>` (`mm:ss` or seconds)
- `--levels-enabled`
- `--left-mvc <value>`
- `--right-mvc <value>`
- `--rest-level <value>`
- `--work-level <value>`

### `critical-force [device]`

```sh
npx @hangtime/cli progressor critical-force --count-down-time 00:03
```

- `--count-down-time <time>` (`mm:ss` or seconds)

### `action [device] [path]`

Run any interactive action (including settings and device-specific actions) non-interactively. If `path` is omitted, all
action paths are listed for that device.

```sh
npx @hangtime/cli action progressor
npx @hangtime/cli action progressor settings/system-info
npx @hangtime/cli action progressor settings/calibration/get-current-calibration-curve
npx @hangtime/cli action motherboard led --led-color green
```

- `-d, --duration <seconds>`
- `--set-calibration-curve <hex>`
- `--save-calibration`
- `--led-color <green|red|orange|off>`
- `--threshold-lbs <value>`

### `repeaters [device]`

```sh
npx @hangtime/cli progressor repeaters --sets 3 --reps 12 --rep-dur 10 --rep-pause-dur 6 --set-pause-dur 08:00 --count-down-time 3 --mode bilateral --initial-side side.left --pause-between-sides 10 --levels-enabled --left-mvc 45 --right-mvc 43 --rest-level 40 --work-level 80
```

- `--sets <number>`
- `--reps <number>`
- `--rep-dur <time>` (`mm:ss` or seconds)
- `--rep-pause-dur <time>` (`mm:ss` or seconds)
- `--set-pause-dur <time>` (`mm:ss` or seconds)
- `--count-down-time <time>` (`mm:ss` or seconds)
- `--mode <single|bilateral>`
- `--initial-side <side.left|side.right>`
- `--pause-between-sides <time>` (`mm:ss` or seconds)
- `--levels-enabled`
- `--left-mvc <value>`
- `--right-mvc <value>`
- `--rest-level <value>`
- `--work-level <value>`

## Measurements

- Stream test start menus include a `Measurements` entry.
- Implemented tests (`Peak Force / MVC`, `Endurance`, `Repeaters`, `RFD`, `Critical Force`) ask
  `Save measurement? [y/N]` when finished.
- Measurements are stored at `~/.grip-connect/measurements.json`.

## JSON Mode

Use `--json` for machine-readable output, useful for piping into other tools:

```sh
npx @hangtime/cli --json list
npx @hangtime/cli --json progressor live
npx @hangtime/cli --json progressor peak-force-mvc
```

## Requirements

- [Node.js](https://nodejs.org/) 22+
- A Bluetooth adapter
