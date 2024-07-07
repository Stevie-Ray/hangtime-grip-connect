# Grip Connect

**Force-Sensing Climbing Training**

The objective of this project is to create a Web Bluetooth API client that can establish connections with various
Force-Sensing Hangboards / Plates / LED system boards used by climbers for strength measurement. Examples of such
hangboards include the [Griptonite Motherboard](https://griptonite.io/shop/motherboard/),
[Climbro](https://climbro.com/), [mySmartBoard](https://www.smartboard-climbing.com/),
[Entralpi](https://entralpi.com/), [Tindeq Progressor](https://tindeq.com/) or
[MAT Muscle Meter](https://www.matassessment.com/musclemeter)

And LED system boards from [Aurora Climbing](https://auroraclimbing.com/) like the
[Kilter Board](https://settercloset.com/pages/the-kilter-board),
[Tension Board](https://tensionclimbing.com/product/tension-board-2/),
[Grasshopper Board](https://grasshopperclimbing.com/products/),
[Decoy Board](https://decoy-holds.com/pages/decoy-board), [Touchstone Board](https://touchstoneboardapp.com/) and
[So iLL Board](https://apps.apple.com/us/app/so-ill-board/id1358056082).

Learn more: [Docs](https://stevie-ray.github.io/hangtime-grip-connect/) -
[Browser Support](https://caniuse.com/web-bluetooth)

> [!CAUTION] This project is provided "as-is" without any express or implied warranties. By using this software, you
> assume all risks associated with its use, including but not limited to hardware damage, data loss, or any other issues
> that may arise. The developers and contributors are not responsible for any harm or loss incurred. Use this software
> at your own discretion and responsibility.

## Try it out

[Chart](https://grip-connect.vercel.app/) - [Flappy Bird](https://grip-connect-flappy-bird.vercel.app/) -
[Kilter Board](https://grip-connect-kilter-board.vercel.app/)

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
import { Motherboard, battery, connect, disconnect, info, notify, stream } from "@hangtime/grip-connect"

const motherboardButton = document.querySelector("#motherboard")

motherboardButton.addEventListener("click", () => {
  connect(Motherboard, async () => {
    // Listen for stream notifications
    notify((data) => {
      // { massTotal: "0", massMax: "0", massAverage: "0", massLeft: "0", massCenter: "0", massRight: "0" }
      console.log(data)
    })

    // Read battery + device info
    await battery(Motherboard)
    await info(Motherboard)

    // Start weight streaming (for a minute) remove parameter for a continues stream
    await stream(Motherboard, 60000)

    // Manualy tare the device when the stream is running
    // await tare(5000)

    // Manually call stop method if stream is continues
    // await stop(Motherboard)

    // Download data to CSV: format => timestamp, frame, battery, samples, masses
    // download()

    // Disconnect from device after we are done
    disconnect(Motherboard)
  })
})
```

## Roadmap

**Help wanted:** Do you own any of these devices? Use Google Chrome's Bluetooth Internals
`chrome://bluetooth-internals/#devices` and press `Start Scan` to look for your device, click on `Inspect` and share all
available services with us.

### Device support

- ✅ Griptonite Motherboard
- ✅ Tindeq Progressor
- ⏳ Entralpi (not verified)
- ⏳ Kilterboard (write only, see example)
- ➡️ Climbro
- ➡️ mySmartBoard
- ➡️ MAT Muscle Meter

### Features

- ✅ Connect / Disconnect
- ✅ Start / Stop data stream
- ✅ Battery status
- ✅ Read calibration
- ✅ Device info: firmware / serial etc.
- ✅ Check if device is connected
- ✅ Peak / Average load
- ✅️ Tare / unladen weight
- ✅️ Download data to CVS
- ➡️ Endurance
- ➡️ Rate of Force Development: RFD
- ➡️ Critical Force

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
- [@1-max-1](https://github.com/1-max-1/fake_kilter_board) for the docs on his Kilter Board
  [https://github.com/1-max-1/fake_kilter_board](simulator).

## Disclaimer

THIS SOFTWARE IS NOT OFFICIALLY SUPPORTED, SUPPLIED OR MAINTAINED BY THE DEVICE MANUFACTURER. BY USING THE SOFTWARE YOU
ARE ACKNOWLEDGING THIS AND UNDERSTAND THAT USING THIS SOFTWARE WILL INVALIDATE THE MANUFACTURERS WARRANTY.

## License

BSD 2-Clause © [Stevie-Ray Hartog](https://github.com/Stevie-Ray)
