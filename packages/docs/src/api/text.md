### Supported Devices

```ts
import { Motherboard } from "./devices"
```

### Basic Usage

```ts
import { connect, text, Motherboard } from "@hangtime/grip-connect"

connect(Motherboard, async () => {
  /**
   * Retrieves the entire 320 bytes of non-volatile memory from the device.
   *
   * The memory consists of 10 segments, each 32 bytes long. If any segment was previously written,
   * the corresponding data will appear in the response. Unused portions of the memory are
   * padded with whitespace.
   *
   * @param {Device} board - The device from which to retrieve text information.
   * @returns {Promise<string>} A Promise that resolves with the 320-byte memory content as a string,
   *                            which includes both the written data and any unused, whitespace-padded segments.
   * @throws {Error} Throws an error if the device is not connected.
   */
  const storedText = await text(Motherboard)
  console.log(storedText)
})
```