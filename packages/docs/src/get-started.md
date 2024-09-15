# Get Started

The objective of this project is to create a Web Bluetooth API client that can establish connections with various
Force-Sensing Hangboards / Dynamometers / Plates / LED system boards used by climbers. Examples of such tools include
the [Griptonite Motherboard](https://griptonite.io/shop/motherboard/), [Climbro](https://climbro.com/),
[mySmartBoard](https://www.smartboard-climbing.com/), [Entralpi](https://entralpi.com/),
[Tindeq Progressor](https://tindeq.com/) or
[Weiheng WH-C06](https://weihengmanufacturer.com/products/wh-c06-bluetooth-300kg-hanging-scale/).

And LED system boards from [Aurora Climbing](https://auroraclimbing.com/) like the
[Kilter Board](https://settercloset.com/pages/the-kilter-board),
[Tension Board](https://tensionclimbing.com/product/tension-board-2/),
[Grasshopper Board](https://grasshopperclimbing.com/products/),
[Decoy Board](https://decoy-holds.com/pages/decoy-board), [Touchstone Board](https://touchstoneboardapp.com/) and
[So iLL Board](https://apps.apple.com/us/app/so-ill-board/id1358056082).

Learn more: [Docs](https://stevie-ray.github.io/hangtime-grip-connect/) -
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
import { Motherboard, active, battery, connect, disconnect, firmware, notify, stream } from "@hangtime/grip-connect"

const motherboardButton = document.querySelector("#motherboard")

motherboardButton.addEventListener("click", () => {
  connect(
    Motherboard,
    async () => {
      // Listen for stream notifications
      notify((data) => {
        // { massTotal: "0", massMax: "0", massAverage: "0", massLeft: "0", massCenter: "0", massRight: "0" }
        console.log(data)
      })

      // Reactive check if device is active
      active(
        (isActive) => {
          console.log(isActive)
        },
        // Optionally using a weight threshold and duration
        { threshold: 2.5, duration: 1000 },
      )

      // Read info: battery + firmware
      const batteryLevel = await battery(Motherboard)
      console.log(batteryLevel)

      const firmwareVersion = await firmware(Motherboard)
      console.log(firmwareVersion)

      // LEDs: "green", "red", "orange", or no argument to turn off
      // await led(Motherboard, "red")
      // await led(Motherboard)

      // Start weight streaming (for a minute) remove parameter for a continues stream
      await stream(Motherboard, 60000)

      // Manualy tare the device when the stream is running
      // await tare(5000)

      // Manually call stop method if stream is continues
      // await stop(Motherboard)

      // Download data as CSV, JSON, or XML (default: CSV) format => timestamp, frame, battery, samples, masses
      // download('json')

      // Disconnect from device after we are done
      disconnect(Motherboard)
    },
    (error) => {
      // Optinal custom error handeling
      console.error(error.message)
    },
  )
})
```
