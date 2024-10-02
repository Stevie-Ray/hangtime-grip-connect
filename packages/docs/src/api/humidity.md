### Supported Devices

```ts
import { ForceBoard } from "./devices"
```

### Basic Usage

```ts
import { ForceBoard } from "@hangtime/grip-connect"

const forceboard = new ForceBoard()

forceboard.connect(async () => {
  /**
   * Retrieves humidity level from the device.
   * @returns {Promise<string>} A Promise that resolves with the humidity level,
   */
  const humidityLevel = await forceboard.humidity()
  console.log(humidityLevel)
})
```
