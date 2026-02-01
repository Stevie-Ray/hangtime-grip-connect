# Web

Use the core package `@hangtime/grip-connect` in any web app that supports the [Web Bluetooth API](/browser-support).
Best for: browser-based demos, dashboards, and apps where users connect from Chrome, Edge, or Opera (desktop or
Android).

## Install

::: code-group

```sh [npm]
npm install @hangtime/grip-connect
```

```sh [Bun]
bun add @hangtime/grip-connect
```

:::

Also on [npm](https://www.npmjs.com/package/@hangtime/grip-connect) and [JSR](https://jsr.io/@hangtime/grip-connect).

### CDN (unpkg)

Load the library without a build step using [unpkg](https://unpkg.com/):

```html
<script type="module">
  import { Motherboard } from "https://unpkg.com/@hangtime/grip-connect@latest?module"
  const device = new Motherboard()
  // ...
</script>
```

See [Get started: Using from CDN](/get-started#using-from-cdn) for an import map example and version pinning.

## Usage

Import the device class you need and use the same API as in the [Guide](/guide) and [Get started](/get-started).

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()
device.notify((data) => console.log(data))

document.querySelector("#connect").addEventListener("click", async () => {
  await device.connect(
    async () => {
      console.log(await device.battery())
      await device.stream(30000)
      device.disconnect()
    },
    (err) => console.error(err.message),
  )
})
```

## Requirements

- **Secure context:** HTTPS or localhost.
- **User gesture:** Connection must be started by a click/tap.
- **Supported browser:** Chrome, Edge, or Opera (see [Browser support](/browser-support)).

## Bundlers

Works with Vite, Webpack, Rollup, and other bundlers. The package ships ESM and CJS; use the entry that matches your
environment.

## Next steps

- [Get started](/get-started) - Install and minimal example.
- [Examples](/examples/) - Chart, Flappy Bird, Kilter Board, Pong.
