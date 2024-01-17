# Grip Connect

**Force-Sensing Climbing Training**

The objective of this project is to create a Web Bluetooth API client that can establish connections with various
Force-Sensing Hangboards / Plates used by climbers for strength measurement. Examples of such hangboards include the
[Motherboard](https://griptonite.io/shop/motherboard/), [Climbro](https://climbro.com/),
[SmartBoard](https://www.smartboard-climbing.com/), [Entralpi](https://entralpi.com/) or
[Tindeq Progressor](https://tindeq.com/)

[Try it out](https://grip-connect.vercel.app/) - [Docs](https://stevie-ray.github.io/hangtime-grip-connect/) -
[Browser Support](https://caniuse.com/web-bluetooth)

## Roadmap

- ✅ Griptonte Motherboard
  - ✅️ Connect with devices
  - ✅️ Read / Write / Notify using Bluetooth
  - ➡️ Calibrate Devices
  - ✅️ Output weight/force stream
- ✅ Tindeq Progressor
  - ✅️ Connect with devices
  - ✅️ Read / Write / Notify using Bluetooth
  - ➡️ Calibrate Devices
  - ➡️ Output weight/force stream
- ✅ Entralpi
  - ✅️ Connect with devices
  - ✅️ Read / Write / Notify using Bluetooth
  - ➡️ Calibrate Devices
  - ➡️ Output weight/force stream
- ➡️ Climbro
  - ➡️ Connect with devices
  - ➡️ Read / Write / Notify using Bluetooth
  - ➡️ Calibrate Devices
  - ➡️ Output weight/force stream
- ➡️ SmartBoard
  - ➡️ Connect with devices
  - ➡️ Read / Write / Notify using Bluetooth
  - ➡️ Calibrate Devices
  - ➡️ Output weight/force stream

## Development

```bash
git clone https://github.com/Stevie-Ray/hangtime-grip-connect
cd hangtime-grip-connect
npm install
```

## Install

```sh [npm]
$ npm install @hangtime/grip-connect
```

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

    // recalibrate
    await write(Motherboard, "uart", "tx", "", 0)
    await write(Motherboard, "uart", "tx", "", 0)
    await write(Motherboard, "uart", "tx", "", 1000)

    await write(Motherboard, "uart", "tx", "C3,0,0,0'", 5000)

    // start stream
    await write(Motherboard, "uart", "tx", "S20", 15000)

    // end stream
    await write(Motherboard, "uart", "tx", "", 0)
    // disconnect from device after we are done
    disconnect(Motherboard)
  })
})
```

## Credits

A special thank you to:

- [@CassimLadha](https://github.com/CassimLadha) for sharing insights on reading the Motherboards data.
- [@donaldharvey](https://github.com/donaldharvey) for a valuable example on connecting to the motherboard.

## Disclamer

THIS SOFTWARE IS NOT OFFICIALY SUPPORTED, SUPPLIED OR MAINTAINED BY THE DEVICE MANUFACTURER. BY USING THE SOFTWARE YOU
ARE ACKNOWLEDGEING THIS AND UNDERSTAND THAT USING THIS SOFTWARE WILL INVALIDATE THE MANUFACTURERS WARRANTY.

## License

BSD 2-Clause © [Stevie-Ray Hartog](https://github.com/Stevie-Ray)
