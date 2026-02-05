# Grip Connect - CLI

A Command Line Interface for connecting to grip strength training devices via Bluetooth, powered by
`@hangtime/grip-connect` and `webbluetooth`.

## Quick Start

```sh
npx @hangtime/grip-connect-cli
```

This launches interactive mode where you can pick a device, connect, and choose actions.

## Install

```sh
npm install -g @hangtime/grip-connect-cli
```

## Usage

```sh
# Interactive mode (pick device and actions)
grip-connect

# List all supported devices
grip-connect list

# Stream force data for 10 seconds
grip-connect stream progressor

# Stream indefinitely until Ctrl+C
grip-connect watch progressor

# Show device info (battery, firmware, etc.)
grip-connect info entralpi

# Export session data
grip-connect download forceboard --format csv

# Run tare (zero) calibration
grip-connect tare motherboard --duration 5000

# Monitor activity status
grip-connect active progressor --threshold 2.5
```

## Supported Devices

| Key            | Name           | Capabilities                            |
| -------------- | -------------- | --------------------------------------- |
| climbro        | Climbro        | battery, tare, download, active         |
| entralpi       | Entralpi       | battery, tare, download, active         |
| forceboard     | ForceBoard     | stream, battery, tare, download, active |
| motherboard    | Motherboard    | stream, battery, tare, download, active |
| mysmartboard   | mySmartBoard   | tare, download, active                  |
| pb-700bt       | PB-700BT       | battery, tare, download, active         |
| progressor     | Progressor     | stream, battery, tare, download, active |
| smartboard-pro | SmartBoard Pro | tare, download, active                  |
| wh-c06         | WH-C06         | tare, download, active                  |

## Options

```sh
grip-connect --json          # Output newline-delimited JSON
grip-connect --no-color      # Disable colored output
grip-connect --version       # Show version
grip-connect --help          # Show help
```

## JSON Mode

Use `--json` for machine-readable output, useful for piping into other tools:

```sh
grip-connect --json list
grip-connect --json stream progressor
grip-connect --json watch forceboard | jq '.current'
```

## Requirements

- Node.js >= 22
- A Bluetooth adapter
