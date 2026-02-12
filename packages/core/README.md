# Grip Connect

**Force-Sensing Climbing Training**

The objective of this project is to create a Web Bluetooth API client that can establish connections with various
Force-Sensing Hangboards / Dynamometers / Plates / LED system boards used by climbers. Examples of such tools include
the [Griptonite Motherboard](https://griptonite.io/shop/motherboard/),
[Tindeq Progressor](https://tindeq.com/product/progressor/),
[PitchSix Force Board](https://pitchsix.com/products/force-board-portable),
[Weiheng WH-C06](https://weihengmanufacturer.com/products/wh-c06-bluetooth-300kg-hanging-scale/),
[Frez Dyno](https://shop.frez.app/products/pre-order-frez-dyno), [Entralpi](https://entralpi.com/),
[Climbro](https://climbro.com/), or [mySmartBoard](https://www.smartboard-climbing.com/)

And LED system boards from [Aurora Climbing](https://auroraclimbing.com/) like the
[Kilter Board](https://settercloset.com/pages/the-kilter-board),
[Tension Board](https://tensionclimbing.com/product/tension-board-2/),
[Grasshopper Board](https://grasshopperclimbing.com/products/),
[Decoy Board](https://decoy-holds.com/pages/decoy-board), [Touchstone Board](https://touchstoneboardapp.com/) and
[So iLL Board](https://apps.apple.com/us/app/so-ill-board/id1358056082).

And gyroscopic hand exercisers, such as the [NSD PB-700BT](https://www.nsd.com.tw/).

The library is split into platform-specific packages:

- **Web**: The core package for web applications using the Web Bluetooth API
- **Capacitor**: For hybrid mobile apps using Capacitor
- **React Native**: For native mobile apps using React Native
- **Runtime**: Adapter for Node.js, Bun, and Deno—script connections
- **CLI**: Ready to use Command-line tool to connect to devices

Learn more: [Documentation](https://stevie-ray.github.io/hangtime-grip-connect/) -
[Browser Support](https://caniuse.com/web-bluetooth) - [Discord](https://discord.gg/f7QQnEBQQt)

> This project is provided "as-is" without any express or implied warranties. By using this software, you assume all
> risks associated with its use, including but not limited to hardware damage, data loss, or any other issues that may
> arise. The developers and contributors are not responsible for any harm or loss incurred. Use this software at your
> own discretion and responsibility.

## Try it out

[Chart](https://grip-connect.vercel.app/) - [Flappy Bird](https://grip-connect-flappy-bird.vercel.app/) -
[Pong](https://hangtime-grip-connect-pong.vercel.app/) -
[Kilter Board](https://grip-connect-kilter-board.vercel.app/?route=p1083r15p1117r15p1164r12p1185r12p1233r13p1282r13p1303r13p1372r13p1392r14p1505r15)

```bash
npx @hangtime/grip-connect-cli
```

> The CLI requires Node.js 22 or newer

![Force-Sensing Climbing Devices](https://github.com/user-attachments/assets/c1a8ef3b-8d94-47b6-84a6-f73893e948d6)

## Install

The packages are available on both [NPM](https://www.npmjs.com/package/@hangtime/grip-connect) and
[JSR](https://jsr.io/@hangtime/grip-connect).

```bash
# For Web applications
npm install @hangtime/grip-connect

# For Capacitor hybrid mobile apps
npm install @hangtime/grip-connect-capacitor

# For React Native mobile apps
npm install @hangtime/grip-connect-react-native

# For Node.js, Bun, Deno
npm install @hangtime/grip-connect-runtime
```

## Example usage (with a Motherboard)

Simply importing the device you need from `@hangtime/grip-connect`.

```html
<button id="motherboard" type="button">Connect Motherboard</button>
```

```js
import { Motherboard } from "@hangtime/grip-connect"

// Initiate device
const motherboard = new Motherboard()

// Optional: Custom data handler. For pounds ("lbs") or newton ("n"): device.notify((data) => {}, "lbs")
motherboard.notify((data) => {
  // { unit, timestamp, current, peak, mean, distribution? }
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

## Device support

- ✅ [Griptonite - Motherboard](https://stevie-ray.github.io/hangtime-grip-connect/devices/motherboard.html)
- ✅ [Tindeq - Progressor](https://stevie-ray.github.io/hangtime-grip-connect/devices/progressor.html)
- ✅ [Weiheng - WH-C06](https://stevie-ray.github.io/hangtime-grip-connect/devices/wh-c06.html)
  - By default [watchAdvertisements](https://chromestatus.com/feature/5180688812736512) isn't supported . For Chrome,
    enable it at `chrome://flags/#enable-experimental-web-platform-features`.
- ✅ [Kilter Board](https://stevie-ray.github.io/hangtime-grip-connect/devices/kilterboard.html)
- ✅ [Entralpi](https://stevie-ray.github.io/hangtime-grip-connect/devices/entralpi.html) / Lefu / Unique CW275 Scale
- ✅ [PitchSix - Force Board](https://stevie-ray.github.io/hangtime-grip-connect/devices/forceboard.html)
- ✅ [Climbro](https://stevie-ray.github.io/hangtime-grip-connect/devices/climbro.html)
- ✅ [NSD PB-700BT](https://stevie-ray.github.io/hangtime-grip-connect/devices/pb-700bt.html)
- ➡️ [Frez - Dyno](https://stevie-ray.github.io/hangtime-grip-connect/devices/dyno.html)
- ➡️ [Smartboard Climbing - mySmartBoard](https://stevie-ray.github.io/hangtime-grip-connect/devices/mysmartboard.html)
- ➡️
  [Smartboard Climbing - SmartBoard Pro](https://stevie-ray.github.io/hangtime-grip-connect/devices/smartboard-pro.html)

## Features

All devices provide some default features such as `connect`, `isConnected`, and `disconnect`. Additionally, each device
offers specific features—refer to the [documentation](https://stevie-ray.github.io/hangtime-grip-connect/devices/) for
more details on individual devices. There are also extra features that are not part of the device itself, like a
reactive `isActive` check and a `download` feature.

**Help wanted:** Do you own any of the missing devices? Use Google Chrome's Bluetooth Internals
`chrome://bluetooth-internals/#devices` and press `Start Scan` to look for your device, click on `Inspect` and share all
available services with us.

## Development

```bash
git clone https://github.com/Stevie-Ray/hangtime-grip-connect
cd hangtime-grip-connect
npm install
```

## Credits

A special thank you to:

- [@CassimLadha](https://github.com/CassimLadha) for sharing insights on reading the Motherboards data.
- [@donaldharvey](https://github.com/donaldharvey) for a valuable example of connecting to the Motherboard.
- [@ecstrema](https://github.com/ecstrema) for providing [examples](https://github.com/ecstrema/entralpi-games) on how
  to play games with the Entralpi.
- [Tindeq](https://tindeq.com/) for providing an open [Progressor API](https://tindeq.com/progressor_api/).
- [PitchSix](https://pitchsix.com/) for the [Force Board Portable Public API](https://pitchsix.com/pages/downloads).
- [@StuartLittlefair](https://github.com/StuartLittlefair) for his
  [PyTindeq](https://github.com/StuartLittlefair/PyTindeq) implementation.
- [@Phil9l](https://github.com/phil9l) for his research and providing a [blog post](https://bazun.me/blog/kiterboard/)
  on how to connect with the Kilter Board.
- [@1-max-1](https://github.com/1-max-1) for the docs on his Kilter Board
  [simulator](https://github.com/1-max-1/fake_kilter_board) that I converted to
  [hangtime-arduino-kilterboard](https://github.com/Stevie-Ray/hangtime-arduino-kilterboard).
- [@sebws](https://github.com/sebws) for a [code sample](https://github.com/sebws/Crane) of the Weiheng WH-C06 App.
- [@olrut](https://github.com/olrut) for the React Native / Expo [CraneGrip](https://github.com/olrut/CraneGrip) example
  App.
- [@ninopelov](https://github.com/ninopelov) and the Climbro Team for testing and providing insights into their
  protocol.

## Disclaimer

THIS SOFTWARE IS NOT OFFICIALLY SUPPORTED, SUPPLIED OR MAINTAINED BY THE DEVICE MANUFACTURER. BY USING THE SOFTWARE YOU
ARE ACKNOWLEDGING THIS AND UNDERSTAND THAT USING THIS SOFTWARE WILL INVALIDATE THE MANUFACTURERS WARRANTY.

## License

BSD 2-Clause © [Stevie-Ray Hartog](https://github.com/Stevie-Ray)
