---
title: Platforms
description: Web, Capacitor, React Native, Runtime, and CLI usage.
---

# Platforms

The library runs on web (Web Bluetooth), hybrid mobile (Capacitor), React Native, and Node.js/Bun/Deno (Runtime and
CLI). The same [device interface](/api/device-interface) applies; each platform has its own package and setup.

| Platform                                | Package                               | Use case                                                                                               |
| --------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| [Web](/platforms/web)                   | `@hangtime/grip-connect`              | Browsers (Chrome, Edge, Opera; desktop/Android)                                                        |
| [Capacitor](/platforms/capacitor)       | `@hangtime/grip-connect-capacitor`    | iOS and Android hybrid apps                                                                            |
| [React Native](/platforms/react-native) | `@hangtime/grip-connect-react-native` | iOS and Android native apps                                                                            |
| [Runtime](/platforms/runtime)           | `@hangtime/grip-connect-runtime`      | [Node.js](https://nodejs.org/), [Deno](https://deno.com/), [Bun](https://bun.sh/) programmatic adapter |
| [CLI](/platforms/cli)                   | `@hangtime/cli`                       | Ready-made command-line tool: interactive mode, stream, watch, info, tare, download                    |

Pick a platform below for install, config, and code samples.
