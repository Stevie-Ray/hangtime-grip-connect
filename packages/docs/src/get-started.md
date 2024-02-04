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

Simply importing the utilities you need from `@hangtime/grip-connect`.

```html
<button id="motherboard" type="button">Connect Motherboard</button>
```

```js
import { Motherboard, battery, connect, disconnect, info, notify, stream } from "@hangtime/grip-connect"

const motherboardButton = document.querySelector("#motherboard")

motherboardButton.addEventListener("click", () => {
  connect(Motherboard, async () => {
    // Listen for stream notifications
    notify((data) => {
      // data: { massTotal: 0, massLeft: 0, massRight: 0, massCenter: 0 }
      console.log(data)
    })

    // Read battery + device info
    await battery(Motherboard)
    await info(Motherboard)

    // Start weight streaming (for a minute) remove parameter for a continues stream
    await stream(Motherboard, 60000)

    // Manually call stop method if stream is continues
    // await stop(Motherboard)

    // Disconnect from device after we are done
    disconnect(Motherboard)
  })
})
```
