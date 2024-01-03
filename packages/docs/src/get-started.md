# Get Started

The objective of this project is to create a client that can establish connections with various Force-Sensing
Hangboards/Plates used by climbers for strength measurement. Examples of such hangboards include the
[Moterboard](https://griptonite.io/shop/motherboard/), [Climbro](https://climbro.com/),
[SmartBoard](https://www.smartboard-climbing.com/), [Entralpi](https://entralpi.com/) or
[Tindeq Progressor](https://tindeq.com/).

## Installation

::: code-group

```sh [npm]
$ npm install @hangtime/motherboard
```

```sh [pnpm]
$ pnpm add @hangtime/motherboard
```

```sh [yarn]
$ yarn add @hangtime/motherboard
```

```sh [bun]
$ bun add @hangtime/motherboard
```

:::

## Example usage (Motherboard)

Simply importing the utilities you need from `@hangtime/motherboard`. Devices that are currenlty supported:
`Motherboard`, `Tindeq` and `Entralpi`.

```html
<button id="motherboard" type="button">Connect Motherboard</button>
```

```js
import { Motherboard, connect, disconnect, read, write, notify } from "@hangtime/motherboard"

const motherboardButton = document.querySelector("#motherboard")

motherboardButton.addEventListener("click", () => {
  connect(Motherboard, async () => {
    // Listen for notifications
    notify((data) => {
      console.log(data)
    })

    // read battery + device info
    await read(Motherboard, "battery", "level")
    await read(Motherboard, "device", "manufacturer")
    await read(Motherboard, "device", "hardware")
    await read(Motherboard, "device", "firmware")

    // Calibrate?
    await write(Motherboard, "uart", "tx", "C", 5000)

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
