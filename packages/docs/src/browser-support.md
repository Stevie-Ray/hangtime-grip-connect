---
title: Browser support
description: Web Bluetooth requirements, supported browsers, and troubleshooting.
---

# Browser support

The web package uses the [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) to
connect to BLE devices. Support and requirements differ by browser and environment. The underlying standard is
maintained by the [W3C Web Bluetooth Community Group](https://www.w3.org/community/web-bluetooth/); see the
[Web Bluetooth specification (GitHub)](https://github.com/WebBluetoothCG/web-bluetooth) for the spec, use cases, and
implementation status.

## Supported environments

| Environment                   | Support                          |
| ----------------------------- | -------------------------------- |
| **Chrome** (desktop, Android) | Supported                        |
| **Edge** (Chromium)           | Supported                        |
| **Opera**                     | Supported                        |
| **Safari** (macOS, iOS\*)     | Not supported (no Web Bluetooth) |
| **Firefox**                   | Not supported (no Web Bluetooth) |

\* On iOS, Web Bluetooth works in third-party browsers such as
[Bluefy](https://apps.apple.com/us/app/bluefy-web-ble-browser/id1492822055) and
[WebBLE](https://apps.apple.com/us/app/webble/id1193531073). For native apps, use [Capacitor](/platforms/capacitor) or
[React Native](/platforms/react-native).

For per-browser and per-feature details (including Chrome platforms and flags), see the
[Web Bluetooth implementation status](https://github.com/WebBluetoothCG/web-bluetooth/blob/main/implementation-status.md).
Check [caniuse.com/web-bluetooth](https://caniuse.com/web-bluetooth) for up-to-date support.

## Requirements

1. **Secure context**: The page must be served over **HTTPS** or from **localhost**. Mixed content or `http://` (except
   localhost) will block Web Bluetooth.
2. **User gesture**: Connection must be initiated by a **user gesture** (e.g. click, tap). Calling `device.connect()`
   from a timeout or on load will fail.
3. **Bluetooth available**: The device must have Bluetooth enabled and the OS must allow the browser to use it.

## Mobile and alternative platforms

- **Web on mobile:** Chrome on Android supports Web Bluetooth. iOS Safari does not support Web Bluetooth; use
  [Capacitor](/platforms/capacitor) or [React Native](/platforms/react-native) for iOS.
- **Capacitor:** Uses `@capacitor-community/bluetooth-le` and works on iOS and Android. See
  [Platforms: Capacitor](/platforms/capacitor).
- **React Native:** Uses [react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx) and works on iOS and
  Android. See [Platforms: React Native](/platforms/react-native).
- **CLI:** Uses `webbluetooth` (Node) or platform-specific BLE. See [Platforms: CLI](/platforms/cli).

## WH-C06 and advertisement scanning

For the [Weiheng WH-C06](/devices/wh-c06), Chrome’s **watchAdvertisements** may be required. If the device is not
discovered:

1. Paste `chrome://flags/#enable-experimental-web-platform-features` into the Chrome address bar.
2. Enable **Experimental Web Platform features**.
3. Restart Chrome.

See the [WH-C06 device page](/devices/wh-c06) for details.

## Device debugging

In Chrome (desktop or Android), you can inspect Bluetooth devices and GATT services:

- **Chrome Bluetooth Internals** - Paste `chrome://bluetooth-internals/#devices` into the Chrome address bar (links to
  `chrome://` do not open from web pages). There you can view discovered and connected BLE devices, services, and
  characteristics. Use it to verify that your device advertises correctly and to debug connection or characteristic
  issues. No user gesture is required; helpful to confirm the device is in range and advertising the expected services.

## Troubleshooting

| Issue                     | Check                                                                                                                             |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| "User cancelled"          | User must click/tap to start connection; avoid calling `connect()` without a gesture.                                             |
| "Origin is not allowed"   | Use HTTPS or localhost.                                                                                                           |
| "Bluetooth not available" | Enable Bluetooth in OS and ensure the browser has permission.                                                                     |
| Device not found          | Ensure the device is on, in range, and not connected to another app. For WH-C06, try enabling experimental Web Platform features. |

### Testing locally

Use **localhost** (e.g. `npm run dev` with Vite) so Web Bluetooth works without HTTPS. For testing on a phone, use a
tunnel or deploy to a host with HTTPS. See [Get started](/get-started) for a minimal example.

For more help, see [GitHub Issues](https://github.com/Stevie-Ray/hangtime-grip-connect/issues) or
[Discord](https://discord.gg/f7QQnEBQQt).
