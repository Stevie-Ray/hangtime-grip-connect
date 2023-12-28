# Get Started

Web Motherboard is a small Web Bluetooth API utility to connect with the Griptonite Motherboard.

## Installation

::: code-group

```sh [npm]
$ npm install @motherboard/core
```

```sh [pnpm]
$ pnpm add @motherboard/core
```

```sh [yarn]
$ yarn add @motherboard/core
```

:::

## Example usage

Simply importing the utilities you need from `@motherboard/core`

```html
<button id="bluetooth" type="button">Connect Motherboard</button>
```

```js
import Motherboard, { connect, read, write, disconnect } from "@motherboard/core"

const bluetoothButton = document.querySelector("#bluetooth")

bluetoothButton.addEventListener("click", () => {
  connect(async () => {
    // read battery + device info
    await read(Motherboard.bat)
    await read(Motherboard.devMn)
    await read(Motherboard.devHr)
    await read(Motherboard.devFr)

    // get the stream info
    await write(Motherboard.uartTx, "C", 5000)
    await write(Motherboard.led01, "1", 5000)
    await write(Motherboard.led02, "0", 5000)
    await write(Motherboard.uartTx, "S8", 15000)
    await write(Motherboard.led01, "0", 5000)
    await write(Motherboard.led02, "1", 5000)
    await write(Motherboard.uartTx, "S8", 15000)

    // disconnect from device after we are done
    disconnect()
  })
})
```
