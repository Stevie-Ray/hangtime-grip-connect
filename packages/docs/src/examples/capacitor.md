---
title: Capacitor
description:
  Hybrid mobile example using @hangtime/grip-connect-capacitor on iOS and Android. Reference for native BLE and device
  connection.
---

# Capacitor example

A minimal Capacitor app for iOS and Android (and in the browser). Use it to see how to wire
`@hangtime/grip-connect-capacitor` with `@capacitor-community/bluetooth-le`, run BLE on native, and connect to supported
devices.

## Source

[examples/capacitor](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/capacitor)

## Stack

- [Vite](https://vitejs.dev/)
- [Capacitor](https://capacitorjs.com/)
- [@capacitor-community/bluetooth-le](https://www.npmjs.com/package/@capacitor-community/bluetooth-le)

## Usage

The example is a single-page app with a **device picker** (Climbro, Entralpi, Force Board, Motherboard, PB-700BT,
Progressor, Smart Board Pro, WH-C06). After you choose a device type, it instantiates the matching class, connects over
BLE, and shows connection status and streamed data. Use it as a reference for:

- Installing and configuring the Capacitor package and Bluetooth LE plugin
- Creating device instances and calling `connect()`, `notify()`, `stream()` from a Capacitor app
- Running the same code on web (Vite dev server), iOS, and Android

**Best experience:** Run as a **native app** (iOS or Android). BLE works in the browser too (e.g. Chrome on desktop or
Android), but native builds have the most reliable Bluetooth LE support. On web with a WH-C06 you may need to enable
Chrome’s experimental Web Platform features.

## Run

From the repo root:

```sh
npm install
npm run build:examples:capacitor

npx cap open ios
# or
npx cap open android
```

For local web only: `npm run dev:examples:capacitor`. See [Platforms: Capacitor](/platforms/capacitor) for install and
native setup.
