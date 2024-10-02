### Basic Usage

```ts
import { ForceBoard } from "@hangtime/grip-connect"

const device = new ForceBoard()
```

### Device features

See [Devices](/devices/) for default device features.

```ts
  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information.
   */
  battery(): Promise<string | undefined>

  /**
   * Retrieves humidity level from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the humidity level.
   */
  humidity(): Promise<string | undefined>

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the manufacturer information.
   */
  manufacturer(): Promise<string | undefined>
```
