---
title: React Native
description:
  Expo app using @hangtime/grip-connect-react-native for iOS and Android. Reference for native BLE, device picker, and
  training flows.
---

# React Native example

An Expo app for iOS and Android. It demonstrates a full training-style flow: pick a device, connect over BLE, and run
training modes (peak force, endurance, timed hangs). The example is based on
[CraneGrip](https://github.com/olrut/CraneGrip), and uses `react-native-ble-plx`.

## Source

[examples/react-native](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/react-native)

## Stack

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [react-native-ble-plx](https://www.npmjs.com/package/react-native-ble-plx)

## Usage

The example is a tabbed app with:

- **Home:** Choose a training mode. Each uses a scale/force device (e.g. CTS500, Progressor, Force Board, Frez Dyno,
  WH-C06) and the shared [device interface](/api/device-interface) (`connect`, `notify`, `stream`).
- **Device picker:** Select device type (WH-C06, Climbro, CTS500, Entralpi, Force Board, Frez Dyno, Motherboard,
  mySmartBoard, Progressor). The app creates the matching device class, scans, connects, and streams force data.
- **History & settings:** Persist workout results and configure holds/units.

Use it as a reference for:

- Installing and configuring the React Native package and BLE library
- Scanning and connecting from React Native (permissions, `BleManager`, device creation)
- Integrating with React state and UI (connection status, streamed values, modals)
- Running the same device logic on iOS and Android

Use a physical iOS or Android device with an
[Expo development build](https://docs.expo.dev/develop/development-builds/introduction/). Expo Go and device simulators
cannot provide the native Bluetooth connection required by this example.

## Run

From the repo root:

```sh
npm install
cp examples/react-native/.env.example examples/react-native/.env.local
# Add EXPO_PUBLIC_FREZ_ACCESS_KEY to .env.local when using Frez Dyno.
npm run dev:examples:react-native
```

Expo loads `EXPO_PUBLIC_FREZ_ACCESS_KEY` automatically. Public variables are included in the compiled application, so
use a personal key only for local development and do not distribute that build.

Then run the development build on a physical iOS or Android device. See
[Platforms: React Native](/platforms/react-native) for native BLE setup.
