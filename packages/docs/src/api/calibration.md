### Supported Devices

```ts
import { Motherboard } from "./devices"
```

### Basic Usage
Get the Motherboards calibration.

This will print all the calibration points E.g. 16 lines in format %u,%u,%f,%ld\r\n. 
The second line in the example would be 0,1,1.23400000,567.

```ts
import { connect, calibration, Progressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
    /**
     * Writes a command to get calibration data from the device.
     * @param {Device} board - The device.
     * @returns {Promise<void>} A Promise that resolves when the command is successfully sent.
     */
    await calibration(Motherboard)
})
```