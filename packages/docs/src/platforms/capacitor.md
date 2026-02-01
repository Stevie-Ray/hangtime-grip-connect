# Capacitor

Use `@hangtime/grip-connect-capacitor` in hybrid mobile apps (iOS and Android). It wraps the core API and uses
[@capacitor-community/bluetooth-le](https://github.com/capacitor-community/bluetooth-le) for BLE. Best for: iOS and
Android apps where you want one codebase (web tech + native BLE) and existing Capacitor tooling.

## Install

```sh
npm install @hangtime/grip-connect-capacitor
```

Package on [npm](https://www.npmjs.com/package/@hangtime/grip-connect-capacitor). You also need the Capacitor Bluetooth
LE plugin and native setup. See the [plugin documentation](https://github.com/capacitor-community/bluetooth-le) for iOS
and Android configuration and permissions.

## Usage

The API is the same as the web/core package. Import device classes from `@hangtime/grip-connect-capacitor`:

```ts
import { Motherboard } from "@hangtime/grip-connect-capacitor"

const device = new Motherboard()
device.notify((data) => console.log(data))

// Trigger connection from a user action (e.g. button tap)
await device.connect(
  async () => {
    console.log(await device.battery())
    await device.stream(30000)
    device.disconnect()
  },
  (err) => console.error(err.message),
)
```

## Supported devices

Same device set as core: Motherboard, Progressor, ForceBoard, KilterBoard, Entralpi, Climbro, mySmartBoard,
SmartBoardPro, WHC06, PB700BT.

## Platform notes

- **iOS:** Requires Bluetooth usage description and proper entitlements. Use a physical device; simulators do not
  support BLE.
- **Android:** Requires Bluetooth permissions in the manifest. Use a physical device for BLE.

See the [Capacitor Bluetooth LE plugin](https://github.com/capacitor-community/bluetooth-le) for full setup and
permissions.

## Next steps

- [Get started](/get-started) - Install and minimal example.
- [Examples](/examples/) - Capacitor demo app in the repo; [Chart](/examples/vite) and
  [Flappy Bird](/examples/flappy-bird) for web patterns that translate to Capacitor.
