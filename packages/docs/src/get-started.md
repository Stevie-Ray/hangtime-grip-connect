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

The library is available in multiple flavors to support different platforms:

- **Web**: The core package for web applications using the Web Bluetooth API
- **Capacitor**: For hybrid mobile apps using Capacitor
- **React Native**: For native mobile apps using React Native
- **CLI**: Command-line tools for device management and data analysis

Learn more: [Docs](https://stevie-ray.github.io/hangtime-grip-connect/) -
[Browser Support](https://caniuse.com/web-bluetooth)

## Installation

The packages are available on both [NPM](https://www.npmjs.com/package/@hangtime/grip-connect) and
[JSR](https://jsr.io/@hangtime/grip-connect).

::: code-group

```sh [npm]
# For Web applications
$ npm install @hangtime/grip-connect

# For Capacitor hybrid mobile apps
$ npm install @hangtime/grip-connect-capacitor

# For React Native mobile apps
$ npm install @hangtime/grip-connect-react-native @dr.pogodin/react-native-fs

# For Node.js, Bun, Deno CLI tools
$ npm install @hangtime/grip-connect-cli
$ bun add @hangtime/grip-connect-cli
$ deno add @hangtime/grip-connect-cli
```

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
      // await motherboard.download('json')

      // Optionally disconnect from device after we are done
      motherboard.disconnect()
    },
    (error) => {
      // Optinal custom error handeling
      console.error(error.message)
    },
  )
})
```
