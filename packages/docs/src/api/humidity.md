### Supported Devices

```ts
import { ForceBoard } from "./devices"
```

### Basic Usage

```ts
import { connect, humidity, ForceBoard } from "@hangtime/grip-connect"

connect(ForceBoard, async () => {
  /**
   * Retrieves humidity level from the device.
   * - For Force Board devices, it reads the humidity level.
   *
   * @param {Device} board - The device from which to retrieve humidity level.
   * @returns {Promise<string>} A Promise that resolves with the humidity level,
   */
  const humidityLevel = await humidity(ForceBoard)
  console.log(humidityLevel)
})
```
