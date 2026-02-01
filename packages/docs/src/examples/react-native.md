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

[examples/reactnative](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/reactnative)

## Stack

- [Expo](https://expo.dev/)
- [React Native](https://reactnative.dev/)
- [react-native-ble-plx](https://www.npmjs.com/package/react-native-ble-plx)

## Usage

The example is a tabbed app with:

- **Home:** Choose a training mode. Each uses a scale/force device (e.g. Progressor, Force Board, WH-C06) and the shared
  [device interface](/api/device-interface) (`connect`, `notify`, `stream`).
- **Device picker:** Select device type (WH-C06, Climbro, Entralpi, Force Board, Motherboard, mySmartBoard, Progressor).
  The app creates the matching device class, scans, connects, and streams force data.
- **History & settings:** Persist workout results and configure holds/units.

Use it as a reference for:

- Installing and configuring the React Native package and BLE library
- Scanning and connecting from React Native (permissions, `BleManager`, device creation)
- Integrating with React state and UI (connection status, streamed values, modals)
- Running the same device logic on iOS and Android (and optionally web via Expo)

**Platforms:** Target iOS and Android with a
[development build](https://docs.expo.dev/develop/development-builds/introduction/) or run in the iOS simulator /
Android emulator. Expo Go has limited native module support; for BLE you need a dev or production build.

## Run

From the repo root:

```sh
npm install
npm run dev:examples:reactnative
```

Then choose **Run on iOS simulator** or **Run on Android device/emulator** from the Expo CLI. For a native build:
`npx expo run:ios` or `npx expo run:android`. See [Platforms: React Native](/platforms/react-native) for install and BLE
setup.
