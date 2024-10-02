### Basic Usage

```ts
import { Progressor } from "@hangtime/grip-connect"

const device = new Progressor()
```

### Device features

See [Devices](/devices/) for default device features.

```ts
  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  battery(): Promise<string | undefined>

  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the firmware version,
   */
  firmware(): Promise<string | undefined>

  /**
   * Starts streaming data from the specified device.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream(duration?: number): Promise<void>
```
