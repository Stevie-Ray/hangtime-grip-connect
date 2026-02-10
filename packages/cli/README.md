# Grip Connect - CLI

A Command Line Interface for connecting to grip strength training devices via Bluetooth, powered by
`@hangtime/grip-connect` and `webbluetooth`.

## Quick Start

```sh
npx @hangtime/grip-connect-cli
```

This launches interactive mode: pick a device, connect, choose actions, then disconnect to return to the device picker
(or run another action).

If you see “could not determine executable to run”, your environment may be using an older cached or local version—try
`npx @hangtime/grip-connect-cli@latest` or pin a specific version.

### Commands (with npx)

```sh
# Interactive mode (pick device and actions)
npx @hangtime/grip-connect-cli

# List all supported devices
npx @hangtime/grip-connect-cli list

# Stream force data (Esc to stop; or use -d for a fixed duration)
npx @hangtime/grip-connect-cli stream progressor

# Stream for a fixed duration (e.g. 10 seconds)
npx @hangtime/grip-connect-cli stream progressor --duration 10

# Watch mode: indefinite stream + session summary (Esc to stop)
npx @hangtime/grip-connect-cli watch progressor

# Use lbs for stream/watch output (default is kg)
npx @hangtime/grip-connect-cli stream forceboard --unit lbs

# Show device info (battery, firmware, device ID, calibration, etc.)
npx @hangtime/grip-connect-cli info entralpi

# Export session data
npx @hangtime/grip-connect-cli download forceboard --format csv

# Run tare (zero) calibration
npx @hangtime/grip-connect-cli tare motherboard --duration 5000

# Monitor activity status
npx @hangtime/grip-connect-cli active progressor --threshold 2.5
```

## Optional: Global install

```sh
npm install -g @hangtime/grip-connect-cli
```

Then use the `grip-connect` command anywhere:

```sh
# Interactive mode (pick device and actions)
grip-connect

# List all supported devices
grip-connect list

# Stream force data (Esc to stop; or use -d for a fixed duration)
grip-connect stream progressor

# Stream for a fixed duration (e.g. 10 seconds)
grip-connect stream progressor --duration 10

# Watch mode: indefinite stream + session summary (Esc to stop)
grip-connect watch progressor

# Show device info (battery, firmware, device ID, calibration, etc.)
grip-connect info entralpi

# Export session data
grip-connect download forceboard --format csv

# Run tare (zero) calibration
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
npx @hangtime/grip-connect-cli --json          # Output newline-delimited JSON
npx @hangtime/grip-connect-cli --no-color      # Disable colored output
npx @hangtime/grip-connect-cli --unit lbs      # Force unit for stream/watch (default: kg; -u shorthand)
npx @hangtime/grip-connect-cli --version       # Show version
npx @hangtime/grip-connect-cli --help          # Show help
```

## JSON Mode

Use `--json` for machine-readable output, useful for piping into other tools:

```sh
npx @hangtime/grip-connect-cli --json list
npx @hangtime/grip-connect-cli --json stream progressor
npx @hangtime/grip-connect-cli --json watch forceboard | jq '.current'
```

## Requirements

- [Node.js](https://nodejs.org/) 22+
- A Bluetooth adapter
