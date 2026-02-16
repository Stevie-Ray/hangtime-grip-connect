---
# https://vitepress.dev/reference/default-theme-home-page
layout: home
title: Home
description:
  Web Bluetooth client for force-sensing hangboards, dynamometers, and LED system boards. Connect, stream, and build.
hero:
  name: "Grip Connect"
  text: "Force-Sensing Climbing Training"
  tagline: "Connect over Bluetooth, stream force data, and build web or mobile apps."
  actions:
    - theme: brand
      text: Get started
      link: /get-started
    - theme: alt
      text: Quick start guide
      link: /guide
    - theme: alt
      text: View on GitHub
      link: https://github.com/Stevie-Ray/hangtime-grip-connect
---

A TypeScript client for the [Web Bluetooth API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Bluetooth_API) that
talks to force-sensing climbing hardware: **Griptonite Motherboard**, **Tindeq Progressor**, **PitchSix Force Board**,
**Kilter Board**, **Entralpi**, **Climbro**, **mySmartBoard**, **WH-C06**, **Frez Dyno**, and more. Use it to stream
force data, drive games, or build training apps on web, Capacitor, React Native, or the CLI.

::: tip Browser support

Web package requires Chrome, Edge, or Opera (Web Bluetooth). See [Browser support](/browser-support). For iOS, use
[Capacitor](/platforms/capacitor) or [React Native](/platforms/react-native).

:::

<div class="vp-doc" style="margin-top: 2rem;">

### Why use it

- **One API** - Same `connect`, `notify`, `stream`, `download` across all supported devices.
- **Multi-platform** - Web, Capacitor, React Native, and [Node.js](https://nodejs.org/) / [Bun](https://bun.sh/) /
  [Deno](https://deno.com/) via [Runtime](/platforms/runtime) and [CLI](/platforms/cli) from a single codebase.
- **TypeScript** - Full types and device interfaces for tree-shaking and IDE support.
- **Battle-tested** - Used by [HangTime](https://play.google.com/store/apps/details?id=nl.stevie.ray.hangtime) and
  [Heli-Hero](https://play.google.com/store/apps/details?id=nl.stevie.ray.helihero) and open-source examples.

</div>

<div class="vp-doc" style="margin-top: 2rem;">

### Get started in 3 steps

| Step | Action                                                                                                              |
| ---- | ------------------------------------------------------------------------------------------------------------------- |
| 1    | [Install](/get-started#installation) the package for your platform (Web, Capacitor, React Native, Runtime, or CLI). |
| 2    | Follow the [Quick start guide](/guide): connect, subscribe to data, and stream in a few lines.                      |
| 3    | Pick your [device](/devices/) and use device-specific APIs (battery, LED, stream, download).                        |

</div>

<div class="vp-doc" style="margin-top: 2rem;">

### Features

- **Connect** - Pair with force-sensing devices over Bluetooth LE; same flow on all platforms.
- **Stream** - Real-time mass/force via `notify()`: `current`, `peak`, `mean`, and optional `distribution`
  (left/center/right zones).
- **Activity** - `active()` callback with configurable threshold and duration for “user is pulling” detection.
- **Export** - Download session data as CSV, JSON, or XML.
- **Multi-platform** - Same API on web, Capacitor, React Native, and [Node.js](https://nodejs.org/) /
  [Bun](https://bun.sh/) / [Deno](https://deno.com/) via [Runtime](/platforms/runtime) and [CLI](/platforms/cli).

</div>

<div class="vp-doc" style="margin-top: 2rem;">

### Live demos

| Demo                                                          | Description                                                                                                                      |
| ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| [Chart](https://grip-connect.vercel.app/)                     | Stream force from your device and watch it plotted live. Ideal for testing connection and seeing mass/force values in real time. |
| [Flappy Bird](https://grip-connect-flappy-bird.vercel.app/)   | Pull on your hangboard to fly the bird; pull strength controls altitude. Game and workout in one.                                |
| [Kilter Board](https://grip-connect-kilter-board.vercel.app/) | Send a route from the browser. Your Kilter or compatible LED board lights up the problem on the wall.                            |
| [Pong](https://hangtime-grip-connect-pong.vercel.app/)        | Move the paddle by applying force to your device. Minimal game loop that shows streamed force as input.                          |

### Built with it

| App                                                                               | Description                                                                                                                                                                                                                                                                        |
| --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [HangTime](https://play.google.com/store/apps/details?id=nl.stevie.ray.hangtime)  | Hangboard training for climbers: create workouts, track max hang and pull-up progress, 250+ hangboards. [Google Play](https://play.google.com/store/apps/details?id=nl.stevie.ray.hangtime) · [App Store](https://apps.apple.com/us/app/hangtime-hangboard-training/id1631706818). |
| [Heli-Hero](https://play.google.com/store/apps/details?id=nl.stevie.ray.helihero) | BLE hangboard game: fly a helicopter through mountain terrain using a Griptonite Motherboard. [Google Play](https://play.google.com/store/apps/details?id=nl.stevie.ray.helihero).                                                                                                 |

</div>

<div class="vp-doc" style="margin-top: 2rem;">

### Resources

- [Get started](/get-started) · [API](/api/) · [Devices](/devices/) · [Examples](/examples/).
- [GitHub](https://github.com/Stevie-Ray/hangtime-grip-connect) ·
  [Issues](https://github.com/Stevie-Ray/hangtime-grip-connect/issues)
- **Packages** - [npm](https://www.npmjs.com/package/@hangtime/grip-connect) ·
  [npm capacitor](https://www.npmjs.com/package/@hangtime/grip-connect-capacitor) ·
  [npm react-native](https://www.npmjs.com/package/@hangtime/grip-connect-react-native) ·
  [npm runtime](https://www.npmjs.com/package/@hangtime/grip-connect-runtime) ·
  [npm cli](https://www.npmjs.com/package/@hangtime/cli) · [JSR](https://jsr.io/@hangtime/grip-connect) ·
  [unpkg](https://unpkg.com/@hangtime/grip-connect@latest?module) (CDN)
- [Web Bluetooth spec](https://github.com/WebBluetoothCG/web-bluetooth) · [Discord](https://discord.gg/f7QQnEBQQt)

</div>
