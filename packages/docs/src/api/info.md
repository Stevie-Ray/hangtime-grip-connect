### Supported Devices

```ts
import { Motherboard, Progressor } from "./devices"
```

### Basic Usage

```ts
import { connect, info, Progressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
    /**
     * Retrieves device information.
     * @param {Device} board - The device to retrieve information from.
     * @returns {Promise<void>} A promise that resolves when the information retrieval is completed.
     */
    await info(Progressor)
})
```