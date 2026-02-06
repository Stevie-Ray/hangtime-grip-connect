# Grip Connect - CLI

A Command Line Interface for connecting to grip strength training devices via Bluetooth, powered by
`@hangtime/grip-connect` and `webbluetooth`.

## Quick Start

```sh
npx @hangtime/grip-connect-cli
```

This launches interactive mode where you can pick a device, connect, and choose actions.

If you see “could not determine executable to run”, your environment may be using an older cached or local version—use
`@latest` (or a specific version) explicitly as above.

### Commands (with npx)

```sh
# Interactive mode (pick device and actions)
npx @hangtime/grip-connect-cli@latest

# List all supported devices
npx @hangtime/grip-connect-cli@latest list

# Stream force data for 10 seconds
npx @hangtime/grip-connect-cli@latest stream progressor

# Stream indefinitely until Ctrl+C
npx @hangtime/grip-connect-cli@latest watch progressor

# Show device info (battery, firmware, etc.)
npx @hangtime/grip-connect-cli@latest info entralpi

# Export session data
npx @hangtime/grip-connect-cli@latest download forceboard --format csv

# Run tare (zero) calibration
npx @hangtime/grip-connect-cli@latest tare motherboard --duration 5000

# Monitor activity status
npx @hangtime/grip-connect-cli@latest active progressor --threshold 2.5
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

- [Node.js](https://nodejs.org/) 22+
- A Bluetooth adapter
