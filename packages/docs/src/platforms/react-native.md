# React Native

Use `@hangtime/grip-connect-react-native` in React Native (and Expo) apps. It wraps the core API and uses
[react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx) for BLE. Best for: native mobile apps where
you already use React Native or Expo and want full control over the BLE stack.

## Install

```sh
npm install @hangtime/grip-connect-react-native
```

Package on [npm](https://www.npmjs.com/package/@hangtime/grip-connect-react-native). You must complete the
[react-native-ble-plx](https://github.com/dotintent/react-native-ble-plx) setup for both platforms:

- **iOS:** Add Bluetooth usage descriptions to `Info.plist` (e.g. `NSBluetoothAlwaysUsageDescription`,
  `NSBluetoothPeripheralUsageDescription`), configure the Podfile if needed, and run `pod install` in the `ios`
  directory. Use a physical device; the simulator does not support BLE.
- **Android:** Declare Bluetooth permissions in `AndroidManifest.xml` (e.g. `BLUETOOTH`, `BLUETOOTH_CONNECT`,
  `ACCESS_FINE_LOCATION` for older APIs), and ensure your `build.gradle` and SDK versions match the library’s
  requirements. Use a physical device or an emulator with Google Play services for BLE.

See the [react-native-ble-plx documentation](https://github.com/dotintent/react-native-ble-plx#react-native-ble-plx) for
step-by-step installation and troubleshooting.

## Requirements

- **Physical device:** BLE does not work in simulators/emulators.
- **Expo:** Expo Go does not include the native BLE module. Use an
  [Expo Development Build](https://docs.expo.dev/develop/development-builds/introduction/) or bare React Native.

## Usage

The API matches the core package. Import device classes from `@hangtime/grip-connect-react-native`:

```ts
import { Motherboard } from "@hangtime/grip-connect-react-native"

const device = new Motherboard()
device.notify((data) => console.log(data))

// Trigger connection from a user action (e.g. button press)
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

## Example app

The repo includes an
[Expo example app](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/reactnative) that uses this
package. Use it as a reference for project setup and BLE usage.

## Next steps

- [Get started](/get-started) - Install and minimal example.
- [Examples](/examples/) - React Native/Expo app in the repo; [Guide](/guide) for the shared API.
