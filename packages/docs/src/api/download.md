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
   * Exports the data in the specified format (CSV, JSON, XML) with a filename format:
   * 'data-export-YYYY-MM-DD-HH-MM-SS.{format}'.
   *
   * @param {('csv' | 'json' | 'xml')} [format='csv'] - The format in which to download the data.
   * Defaults to 'csv'. Accepted values are 'csv', 'json', and 'xml'.
   *
   * @returns {void} Initiates a download of the data in the specified format.
   */
  download("json")
})
```
