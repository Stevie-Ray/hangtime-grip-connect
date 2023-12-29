## Motherboard

A Web Bluetooth API for the [Griptonite Motherboard](https://griptonite.io/motherboard/) +
[Beastmaker](https://www.beastmaker.co.uk/) used by climbers to improve finger strength.

- ✅ Connect with a Motherboard
- ✅ Read/write data
- ❎ Calibrate
- ❎ Output weight

## Development

```bash
git clone https://github.com/Stevie-Ray/motherboard
cd motherboard
npm install
```

## Install

```sh [npm]
$ npm install @hangtime/motherboard
```

## Example usage

Simply importing the utilities you need from `@hangtime/motherboard`

```html
<button id="bluetooth" type="button">Connect Motherboard</button>
```

```js
import Motherboard, { connect, disconnect, read, write, notify } from "@hangtime/motherboard"

const bluetoothButton = document.querySelector("#bluetooth")

bluetoothButton.addEventListener("click", () => {
    connect(async () => {
        // Listen for notifications
        notify((data: object) => {
            console.log(data)
        })

        // read battery + device info
        await read(Motherboard.bat)
        await read(Motherboard.devMn)
        await read(Motherboard.devHr)
        await read(Motherboard.devFr)

        // Calibrate?
        await write(Motherboard.uartTx, "C", 5000)

        // Read stream?
        await write(Motherboard.led01, "1", 2500)
        await write(Motherboard.led02, "0", 2500)
        await write(Motherboard.uartTx, "S30", 5000)

        // Read stream (2x)?
        await write(Motherboard.led01, "0", 2500)
        await write(Motherboard.led02, "1", 2500)
        await write(Motherboard.uartTx, "S30", 5000)

        // disconnect from device after we are done
        disconnect()
    })
})
```

## License

MIT © [Stevie-Ray Hartog](https://github.com/Stevie-Ray)
