# Grip Connect

**Force-Sensing Climbing Training**

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

> This project is provided "as-is" without any express or implied warranties. By using this software, you assume all
> risks associated with its use, including but not limited to hardware damage, data loss, or any other issues that may
> arise. The developers and contributors are not responsible for any harm or loss incurred. Use this software at your
> own discretion and responsibility.

## Try it out

[Chart](https://grip-connect.vercel.app/) - [Flappy Bird](https://grip-connect-flappy-bird.vercel.app/) -
[Kilter Board](https://grip-connect-kilter-board.vercel.app/?route=p1083r15p1117r15p1164r12p1185r12p1233r13p1282r13p1303r13p1372r13p1392r14p1505r15)

## Install

This project can be found in the [NPM package registry](https://www.npmjs.com/package/@hangtime/grip-connect).

```sh [npm]
$ npm install @hangtime/grip-connect
```

## Example usage (with a Motherboard)

Simply importing the utilities you need from `@hangtime/grip-connect`.

```html
<button id="motherboard" type="button">Connect Motherboard</button>
```

```js
import { Motherboard, active, battery, connect, disconnect, info, notify, stream } from "@hangtime/grip-connect"

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

      // Check if device is being used
      active((value) => {
        console.log(value)
      })

      // Read battery + device info
      await battery(Motherboard)
      await info(Motherboard)

      // trigger LEDs
      // await led(device)

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

## Device support

- ✅ Griptonite - Motherboard
- ✅ Tindeq - Progressor
- ✅ Weiheng - WH-C06
  - By default [watchAdvertisements](https://chromestatus.com/feature/5180688812736512) isn't supported . For Chrome,
    enable it at `chrome://flags/#enable-experimental-web-platform-features`.
- ✅ Kilter Board
- ⏳ Entralpi (not verified)
- ➡️ Climbro
- ➡️ Smartboard Climbing - mySmartBoard

## Features

**Help wanted:** Do you own any of the missing devices? Use Google Chrome's Bluetooth Internals
`chrome://bluetooth-internals/#devices` and press `Start Scan` to look for your device, click on `Inspect` and share all
available services with us.

|                                                                                         | Motherboard | Progressor | WH-C06 | Entralpi | Kilter Board | Climbro | mySmartBoard |
| --------------------------------------------------------------------------------------- | ----------- | ---------- | ------ | -------- | ------------ | ------- | ------------ |
| [Battery](https://stevie-ray.github.io/hangtime-grip-connect/api/battery.html)          | ✅          | ✅         |        |          |              |         |              |
| [Calibration](https://stevie-ray.github.io/hangtime-grip-connect/api/calibration.html)  | ✅          |            |        |          |              |         |              |
| [Connect](https://stevie-ray.github.io/hangtime-grip-connect/api/connect.html)          | ✅          | ✅         | ✅     | ✅       | ✅           |         |              |
| [Disconnect](https://stevie-ray.github.io/hangtime-grip-connect/api/disconnect.html)    | ✅          | ✅         | ✅     | ✅       | ✅           |         |              |
| [Download](https://stevie-ray.github.io/hangtime-grip-connect/api/download.html)        | ✅          | ✅         |        |          |              |         |              |
| [Info](https://stevie-ray.github.io/hangtime-grip-connect/api/info.html)                | ✅          | ✅         |        |          |              |         |              |
| [isActive](https://stevie-ray.github.io/hangtime-grip-connect/api/is-active.html)       | ✅          | ✅         | ✅     | ✅       |              |         |              |
| [isConnected](https://stevie-ray.github.io/hangtime-grip-connect/api/is-connected.html) | ✅          | ✅         | ✅     | ✅       | ✅           |         |              |
| [Led](https://stevie-ray.github.io/hangtime-grip-connect/api/led.html)                  | ✅          |            |        |          | ✅           |         |              |
| [Notify](https://stevie-ray.github.io/hangtime-grip-connect/api/notify.html)            | ✅          | ✅         | ✅     | ✅       |              |         |              |
| [Read](https://stevie-ray.github.io/hangtime-grip-connect/api/read.html)                | ✅          |            |        |          |              |         |              |
| [Stop](https://stevie-ray.github.io/hangtime-grip-connect/api/stop.html)                | ✅          | ✅         |        |          |              |         |              |
| [Stream](https://stevie-ray.github.io/hangtime-grip-connect/api/stream.html)            | ✅          | ✅         |        |          |              |         |              |
| [Tare](https://stevie-ray.github.io/hangtime-grip-connect/api/tare.html)                | ✅          | ✅         | ✅     | ✅       |              |         |              |
| [Write](https://stevie-ray.github.io/hangtime-grip-connect/api/write.html)              | ✅          | ✅         |        |          |              |         |              |

## Development

```bash
git clone https://github.com/Stevie-Ray/hangtime-grip-connect
cd hangtime-grip-connect
npm install
```

## Credits

A special thank you to:

- [@CassimLadha](https://github.com/CassimLadha) for sharing insights on reading the Motherboards data.
- [@donaldharvey](https://github.com/donaldharvey) for a valuable example on connecting to the Motherboard.
- [@ecstrema](https://github.com/ecstrema) for providing [examples](https://github.com/ecstrema/entralpi-games) on how
  to play games with the Entralpi.
- [Tindeq](https://tindeq.com/) for providing an open [Progressor API](https://tindeq.com/progressor_api/).
- [@StuartLittlefair](https://github.com/StuartLittlefair) for his
  [PyTindeq](https://github.com/StuartLittlefair/PyTindeq) implementation.
- [@Phil9l](https://github.com/phil9l) for his research and providing a [blog](https://bazun.me/blog/kiterboard/) on how
  to connect with the Kilter Board.
- [@1-max-1](https://github.com/1-max-1) for the docs on his Kilter Board
  [simulator](https://github.com/1-max-1/fake_kilter_board) that I coverted to
  [hangtime-arduino-kilterboard](https://github.com/Stevie-Ray/hangtime-arduino-kilterboard).
- [@sebws](https://github.com/sebw) for a [code sample](https://github.com/sebws/Crane) of the Weiheng WH-C06 App.

## Disclaimer

THIS SOFTWARE IS NOT OFFICIALLY SUPPORTED, SUPPLIED OR MAINTAINED BY THE DEVICE MANUFACTURER. BY USING THE SOFTWARE YOU
ARE ACKNOWLEDGING THIS AND UNDERSTAND THAT USING THIS SOFTWARE WILL INVALIDATE THE MANUFACTURERS WARRANTY.

## License

BSD 2-Clause © [Stevie-Ray Hartog](https://github.com/Stevie-Ray)
