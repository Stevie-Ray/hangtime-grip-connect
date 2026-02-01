---
title: API
description: Device classes, types, and subpaths from the core package.
---

# API

The package exposes device classes and shared types. The same base [device interface](/api/device-interface) applies to
all devices; each adds its own methods (e.g. `battery()`, `stream()`, `led()`).

| Page                                      | Description                                                                                       |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------- |
| [Exports](/api/exports)                   | Device classes, types, usage, and subpaths from `@hangtime/grip-connect`.                         |
| [Device interface](/api/device-interface) | Base `IDevice`: `connect`, `disconnect`, `notify`, `active`, `read`, `write`, `tare`, `download`. |
| [Data types](/api/data-types)             | `massObject`, `Service`, `Characteristic`, `DownloadPacket`, callbacks, `Commands`.               |

See [Devices](/devices/) for per-device methods and [Quick start guide](/guide) for a minimal example.
