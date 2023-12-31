# Get Started

The objective of this project is to create a Web Bluetooth API client that can establish connections with various
Force-Sensing Hangboards / Plates used by climbers for strength measurement. Examples of such hangboards include the
[Motherboard](https://griptonite.io/shop/motherboard/), [Climbro](https://climbro.com/),
[SmartBoard](https://www.smartboard-climbing.com/), [Entralpi](https://entralpi.com/) or
[Tindeq Progressor](https://tindeq.com/)

[Try it out](https://grip-connect.vercel.app/) - [Docs](https://stevie-ray.github.io/hangtime-grip-connect/) -
[Browser Support](https://caniuse.com/web-bluetooth)

## Installation

::: code-group

```sh [npm]
$ npm install @hangtime/grip-connect
```

```sh [pnpm]
$ pnpm add @hangtime/grip-connect
```

```sh [yarn]
$ yarn add @hangtime/grip-connect
```

```sh [bun]
$ bun add @hangtime/grip-connect
```

:::

## Example usage (Motherboard)

Simply importing the utilities you need from `@hangtime/grip-connect`. Devices that are currently supported:
`Motherboard`, `Tindeq` and `Entralpi`.

```html
<button id="motherboard" type="button">Connect Motherboard</button>
```

```js
import { Motherboard, connect, disconnect, read, write, notify } from "@hangtime/grip-connect"

const motherboardButton = document.querySelector("#motherboard")

motherboardButton.addEventListener("click", () => {
  connect(Motherboard, async () => {
    // Listen for notifications
    notify((data) => {
      console.log(data)
    })

    // read battery + device info
    await read(Motherboard, "battery", "level", 1000)
    await read(Motherboard, "device", "manufacturer", 1000)
    await read(Motherboard, "device", "hardware", 1000)
    await read(Motherboard, "device", "firmware", 1000)

    // Calibrate?
    await write(Motherboard, "uart", "tx", "C", 10000)

    // Read stream?
    await write(Motherboard, "unknown", "01", "1", 2500)
    await write(Motherboard, "unknown", "02", "0", 2500)
    await write(Motherboard, "uart", "tx", "S30", 5000)

    // Read stream (2x)?
    await write(Motherboard, "unknown", "01", "0", 2500)
    await write(Motherboard, "unknown", "02", "1", 2500)
    await write(Motherboard, "uart", "tx", "S30", 5000)

    // disconnect from device after we are done
    disconnect(Motherboard)
  })
})
```
