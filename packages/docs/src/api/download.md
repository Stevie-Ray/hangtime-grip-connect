### Supported Devices

```ts
import { Motherboard, Progressor } from "./devices"
```

### Basic Usage

```ts
import { connect, stream, download, Progressor } from "@hangtime/grip-connect"

connect(Progressor, async () => {
  await stream(Progressor, 60000)
  /**
   * Download data to CSV file: format => timestamp, frame, battery, samples, masses
   */
  download()
})
```
