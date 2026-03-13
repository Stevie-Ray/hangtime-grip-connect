---
name: grip-connect
description:
  Help integrate Grip Connect in web, Capacitor, React Native, runtime, and CLI projects. Use for package selection,
  supported device setup, Bluetooth constraints, streaming and export workflows, CLI and runtime usage, connection
  troubleshooting, and unsupported custom device guidance.
---

# Grip Connect

Use this skill when a user is building with Grip Connect packages, choosing a platform, wiring a supported device, or
debugging connection and setup issues.

## Start with platform and device

Identify these three things before proposing code:

- target platform: web, Capacitor, React Native, runtime, or CLI
- target device: Motherboard, Progressor, ForceBoard, KilterBoard, Entralpi, Climbro, mySmartBoard, SmartBoard Pro,
  WH-C06, or PB-700BT
- desired outcome: connect and stream, export data, build an app feature, script a workflow, or support custom hardware

Do not invent a generic solution before picking the package. Platform choice changes install steps, BLE constraints, and
available examples.

## Package routing

- `@hangtime/grip-connect`: browser apps using Web Bluetooth
- `@hangtime/grip-connect-capacitor`: hybrid iOS and Android apps
- `@hangtime/grip-connect-react-native`: React Native and Expo apps
- `@hangtime/grip-connect-runtime`: Node.js, Bun, or Deno scripts
- `@hangtime/cli`: ready-made command-line workflows

If the platform is not locked yet, read [references/platforms.md](references/platforms.md) first.

## Working style

- Prefer the bundled references in this skill before assuming the user has a full repo checkout.
- If the user is working inside the Grip Connect monorepo, local docs and examples are useful, but do not require them
  to exist.
- Reuse the documented device model: `connect`, `notify`, `active`, `stream`, `download`, and `disconnect`, plus
  device-specific methods like `battery`, `led`, `tare`, or `stop`.
- Surface platform constraints early:
  - Web Bluetooth needs Chrome, Edge, or Opera, plus HTTPS or localhost and a user gesture.
  - Capacitor and React Native need a physical mobile device and native BLE setup.
  - Runtime and CLI need host Bluetooth support.
- If the request is about unsupported or proprietary hardware, use the custom-device guide instead of pretending the
  device already ships in the library.

## Which reference to load

- [references/platforms.md](references/platforms.md): package selection, install commands, platform limits, and offline
  mobile setup checklists
- [references/integration-workflows.md](references/integration-workflows.md): concrete starter snippets across web,
  mobile, runtime, and CLI
- [references/devices-and-troubleshooting.md](references/devices-and-troubleshooting.md): supported devices, known
  limitations, optional method support, and the custom-device path

## Unsupported hardware

If the hardware is not already shipped:

- For app-local experiments or one-off hardware, extend the base `Device` class in the user's project.
- For upstream contribution, follow the monorepo custom-device guide and update `core` first, then platform wrappers and
  docs as needed.
- Use [references/devices-and-troubleshooting.md](references/devices-and-troubleshooting.md) for the custom-device
  outline. If internet access is available, the public guide lives at
  `https://stevie-ray.github.io/hangtime-grip-connect/guide/custom-device`.
