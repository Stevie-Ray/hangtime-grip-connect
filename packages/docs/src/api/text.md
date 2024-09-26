### Supported Devices

```ts
import { Motherboard } from "./devices"
```

### Basic Usage

```ts
import { connect, text, Motherboard } from "@hangtime/grip-connect"

const motherboard = new Motherboard()

motherboard.connect(async () => {
  /**
   * Retrieves the entire 320 bytes of non-volatile memory from the device.
   *
   * The memory consists of 10 segments, each 32 bytes long. If any segment was previously written,
   * the corresponding data will appear in the response. Unused portions of the memory are
   * padded with whitespace.
   *
   * @param {Device} board - The device from which to retrieve text information.
   * @returns {Promise<string>} A Promise that resolves with the 320-byte memory content as a string,
   */
  const storedText = await text(Motherboard)
  console.log(storedText)
})
```
