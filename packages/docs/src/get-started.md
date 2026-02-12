---
title: Get started
description: Install the library for Web, Capacitor, React Native, Runtime, or CLI and run a minimal example.
---

# Get started

This page walks you through installing the library and running a minimal connect-and-stream example. For a step-by-step
flow, see the [Quick start guide](/guide).

## What is it?

The library is a TypeScript client for the
[Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) that connects to force-sensing
hangboards, dynamometers, plates, and LED system boards used by climbers. It supports devices such as:

- **Hangboards:** [Griptonite Motherboard](https://griptonite.io/shop/motherboard/), [Climbro](https://climbro.com/),
  [mySmartBoard](https://www.smartboard-climbing.com/)
- **Dynamometers:** [Tindeq Progressor](https://tindeq.com/product/progressor/),
  [PitchSix Force Board](https://pitchsix.com/products/force-board-portable),
  [Frez Dyno](https://shop.frez.app/products/pre-order-frez-dyno),
  [Weiheng WH-C06](https://weihengmanufacturer.com/products/wh-c06-bluetooth-300kg-hanging-scale/)
- **Scales / force plates:** [Entralpi](https://entralpi.com/)
- **LED system boards:** [Kilter Board](https://settercloset.com/pages/the-kilter-board),
  [Tension Board](https://tensionclimbing.com/product/tension-board-2/),
  [Grasshopper Board](https://grasshopperclimbing.com/products/),
  [Decoy Board](https://decoy-holds.com/pages/decoy-board), [Touchstone Board](https://touchstoneboardapp.com/),
  [So iLL Board](https://apps.apple.com/us/app/so-ill-board/id1358056082)
- **Other:** [NSD PB-700BT](https://www.nsd.com.tw/) (gyroscopic hand exerciser)

The library is available in multiple flavors:

| Platform         | Package                                                                                                  | Use case                                                                                                  |
| ---------------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| **Web**          | [@hangtime/grip-connect](https://www.npmjs.com/package/@hangtime/grip-connect)                           | Browsers using the Web Bluetooth API                                                                      |
| **Capacitor**    | [@hangtime/grip-connect-capacitor](https://www.npmjs.com/package/@hangtime/grip-connect-capacitor)       | Hybrid mobile apps (iOS/Android)                                                                          |
| **React Native** | [@hangtime/grip-connect-react-native](https://www.npmjs.com/package/@hangtime/grip-connect-react-native) | Native mobile apps (Expo / RN)                                                                            |
| **Runtime**      | [@hangtime/grip-connect-runtime](https://www.npmjs.com/package/@hangtime/grip-connect-runtime)           | [Node.js](https://nodejs.org/), [Bun](https://bun.sh/), or [Deno](https://deno.com/) programmatic adapter |
| **CLI**          | [@hangtime/grip-connect-cli](https://www.npmjs.com/package/@hangtime/grip-connect-cli)                   | Ready-made command-line tool for scanning, streaming, and exporting data                                  |

See [Browser support](/browser-support) for Web Bluetooth requirements and [Platforms](/platforms/) for
platform-specific setup.

## Prerequisites

- **Web:** Chrome, Edge, or Opera; HTTPS or localhost; connection must start from a user gesture (e.g. button click).
- **Capacitor / React Native:** Physical device (BLE does not work in simulators); native BLE plugin configured.
- **Runtime / CLI:** [Node.js](https://nodejs.org/), [Bun](https://bun.sh/), or [Deno](https://deno.com/); machine with
  Bluetooth and a supported device in range.

---

## Installation

Install the package for your target platform.

::: code-group

```sh [Web]
npm install @hangtime/grip-connect
```

```sh [Capacitor]
npm install @hangtime/grip-connect-capacitor
```

```sh [React Native]
npm install @hangtime/grip-connect-react-native
```

```sh [Runtime]
npm install @hangtime/grip-connect-runtime
```

```sh [CLI]
npm install -g @hangtime/grip-connect-cli
```

:::

Packages are also available on [JSR](https://jsr.io/@hangtime/grip-connect).

### Using from CDN

You can load the library via [unpkg](https://unpkg.com/) without a build step. Use the latest ESM bundle:

```html
<script type="importmap">
  {
    "imports": {
      "@hangtime/grip-connect": "https://unpkg.com/@hangtime/grip-connect@latest?module"
    }
  }
</script>
<script type="module">
  import { Motherboard } from "@hangtime/grip-connect"
  const device = new Motherboard()
  // ...
</script>
```

Or import the URL directly in a module script:

```html
<script type="module">
  import { Motherboard } from "https://unpkg.com/@hangtime/grip-connect@latest?module"
  const device = new Motherboard()
  // ...
</script>
```

::: tip Pin a version

Replace `@latest` with a specific version (e.g. `@1.2.3`) in production to avoid unexpected updates.

:::

---

## Minimal example (Web)

After installing `@hangtime/grip-connect`, import the device class you need and connect.

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()

// Optional: handle real-time data. For pounds ("lbs") or newton ("n"): device.notify((data) => {}, "lbs")
motherboard.notify((data) => {
  // { unit, timestamp, current, peak, mean, distribution? }
  console.log(data)
})

// Optional: detect when user is pulling
device.active((isActive) => console.log("Active:", isActive), { threshold: 2.5, duration: 1000 })

document.querySelector("#connect").addEventListener("click", async () => {
  await device.connect(
    async () => {
      const battery = await device.battery()
      console.log("Battery:", battery)
      await device.stream(30000) // stream for 30 seconds
      device.disconnect()
    },
    (err) => console.error(err.message),
  )
})
```

```html
<button id="connect" type="button">Connect Motherboard</button>
```

::: warning HTTPS and user gesture

Web Bluetooth requires a **secure context** (HTTPS or localhost) and a **user gesture** (e.g. click) to start the
connection. See [Browser support](/browser-support).

:::

Next: [Quick start guide](/guide) for a step-by-step flow, or [Devices](/devices/) for device-specific APIs.
