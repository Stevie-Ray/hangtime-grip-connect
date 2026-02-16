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

# Live Data: raw force visualised in real-time with chart (Esc to stop; use `tare` before live to zero)
npx @hangtime/cli live progressor  # or: stream progressor

# Live Data for a fixed duration (e.g. 10 seconds)
npx @hangtime/cli live progressor --duration 10

# Watch mode: indefinite stream + session summary (Esc to stop)
npx @hangtime/cli watch progressor

# Use lbs for live/watch output (default is kg)
npx @hangtime/cli live forceboard --unit lbs

# Show device info (battery, firmware, device ID, calibration, etc.)
npx @hangtime/cli info entralpi

# Export session data
npx @hangtime/cli download forceboard --format csv

# Run tare (zero) calibration. For stream devices (Progressor, ForceBoard, Motherboard),
# tare automatically starts a stream first since tare requires live data.
npx @hangtime/cli tare motherboard --duration 5000

# Monitor activity status
npx @hangtime/cli active progressor --threshold 2.5
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
grip-connect live progressor

# Live Data for a fixed duration (e.g. 10 seconds)
grip-connect live progressor --duration 10

# Watch mode: indefinite stream + session summary (Esc to stop)
grip-connect watch progressor

# Show device info (battery, firmware, device ID, calibration, etc.)
grip-connect info entralpi

# Export session data
grip-connect download forceboard --format csv

# Run tare (zero) calibration (stream devices: auto-starts stream first)
grip-connect tare motherboard --duration 5000

# Monitor activity status
grip-connect active progressor --threshold 2.5
```

## Supported Devices

| Key            | Name           | Capabilities                                                                                                             |
| -------------- | -------------- | ------------------------------------------------------------------------------------------------------------------------ |
| climbro        | Climbro        | battery, tare, download, active                                                                                          |
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
npx @hangtime/cli --unit lbs      # Force unit for stream/watch (default: kg; -u shorthand)
npx @hangtime/cli --version       # Show version
npx @hangtime/cli --help          # Show help
```

## JSON Mode

Use `--json` for machine-readable output, useful for piping into other tools:

```sh
npx @hangtime/cli --json list
npx @hangtime/cli --json live progressor
npx @hangtime/cli --json watch forceboard | jq '.current'
```

## Requirements

- [Node.js](https://nodejs.org/) 22+
- A Bluetooth adapter
