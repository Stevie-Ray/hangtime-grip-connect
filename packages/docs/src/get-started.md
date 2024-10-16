# Get Started

The objective of this project is to create a Web Bluetooth API client that can establish connections with various
Force-Sensing Hangboards / Dynamometers / Plates / LED system boards used by climbers. Examples of such tools include
the [Griptonite Motherboard](https://griptonite.io/shop/motherboard/),
[Tindeq Progressor](https://tindeq.com/product/progressor/),
[PitchSix Force Board](https://pitchsix.com/products/force-board-portable),
[Weiheng WH-C06](https://weihengmanufacturer.com/products/wh-c06-bluetooth-300kg-hanging-scale/),
[Entralpi](https://entralpi.com/), [Climbro](https://climbro.com/), or
[mySmartBoard](https://www.smartboard-climbing.com/)

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

Simply importing the device you need from `@hangtime/grip-connect`.

```html
<button id="motherboard" type="button">Connect Motherboard</button>
```

```js
import { Motherboard } from "@hangtime/grip-connect"

// Initiate device
const motherboard = new Motherboard()

// Optional: Custom data handler
motherboard.notify((data) => {
  // { massTotal: "0", massMax: "0", massAverage: "0", massLeft: "0", massCenter: "0", massRight: "0" }
  console.log(data)
})

// Optional: Check if the device is active
motherboard.active(
  (isActive) => {
    console.log(isActive)
  },
  // Optionally using a weight threshold and duration
  { threshold: 2.5, duration: 1000 },
)

document.querySelector("#motherboard").addEventListener("click", async () => {
  // Connect to device
  await motherboard.connect(
    async () => {
      // Example: Read device specific data
      const batteryLevel = await motherboard.battery()
      console.log(batteryLevel)

      // LEDs: "green", "red", "orange", or no argument to turn off
      // await motherboard.led("red")
      // await motherboard.led()

      // Start weight streaming (for 30s) remove parameter for a continues stream
      await motherboard.stream(30000)

      // Manualy tare the device when the stream is running
      // await motherboard.tare(5000)

      // Manually call stop method if stream is continues
      // await motherboard.stop()

      // Download data as CSV, JSON, or XML (default: CSV) format => timestamp, frame, battery, samples, masses
      // motherboard.download('json')

      // Optionally disconnect from device after we are done
      motherboard.disconnect(Motherboard)
    },
    (error) => {
      // Optinal custom error handeling
      console.error(error.message)
    },
  )
})
```
