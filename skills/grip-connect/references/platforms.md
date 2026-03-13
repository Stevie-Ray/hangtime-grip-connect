# Platforms

Use this file when the user has not settled on a Grip Connect package yet or when setup constraints are blocking the
implementation. It is written to work even when the user only installed a package from npm and does not have the full
monorepo checkout.

## Package map

| Platform     | Package                               | Use when...                                   | Must mention                                                                    |
| ------------ | ------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------- |
| Web          | `@hangtime/grip-connect`              | The app runs in the browser                   | Chrome, Edge, or Opera; HTTPS or localhost; `connect()` must start from a click |
| Capacitor    | `@hangtime/grip-connect-capacitor`    | The app is hybrid iOS or Android              | Physical device; native BLE setup is required                                   |
| React Native | `@hangtime/grip-connect-react-native` | The app is React Native or Expo               | Physical device; Expo needs a development build, not Expo Go                    |
| Runtime      | `@hangtime/grip-connect-runtime`      | The user needs Node.js, Bun, or Deno scripts  | Host machine must provide Bluetooth support; `download()` writes files to disk  |
| CLI          | `@hangtime/cli`                       | The user wants a ready-made terminal workflow | Use `npx @hangtime/cli` or a global install instead of writing app code first   |

## Install commands

Use these exact commands when the user only has npm access and not the repo checkout:

```sh
# Web
npm install @hangtime/grip-connect

# Capacitor
npm install @hangtime/grip-connect-capacitor

# React Native / Expo
npm install @hangtime/grip-connect-react-native

# Runtime
npm install @hangtime/grip-connect-runtime

# CLI without installing globally
npx @hangtime/cli
```

For CLI users who want a persistent binary:

```sh
npx @hangtime/cli
```

## Package choice rules

- Use **CLI** when the user mainly wants to inspect devices, stream live data, run tests, tare, or export from the
  terminal.
- Use **Runtime** when the user needs programmatic control in Node.js, Bun, or Deno.
- Use **Web** for browser-first apps and demos.
- Use **Capacitor** when the app is hybrid mobile and the team wants web tech plus native BLE.
- Use **React Native** when the app already lives in React Native or Expo and needs a native BLE stack.

## Shared API expectations

All platform packages follow the same core flow:

- instantiate a device class
- subscribe with `notify()` if real-time data is needed
- optionally use `active()`
- call `connect()`
- use device-specific methods like `battery()`, `stream()`, `tare()`, `led()`, or `download()`
- call `disconnect()` when done

## Capacitor setup checklist

Use this when the user is integrating `@hangtime/grip-connect-capacitor` into a Capacitor app:

1. Install the package:

   ```sh
   npm install @hangtime/grip-connect-capacitor
   ```

2. Sync native projects:

   ```sh
   npx cap sync
   ```

3. iOS checklist:
   - Add `NSBluetoothAlwaysUsageDescription` to `ios/App/App/Info.plist`.
   - If the app must scan or stay connected in the background, add `bluetooth-central` to `UIBackgroundModes`.
   - Test on a physical device, not the simulator.

4. Android checklist:
   - Use a physical device.
   - If scans return nothing, check whether system location services are disabled.
   - Keep the Android native project compatible with the bundled BLE plugin version.

5. App code can import directly from `@hangtime/grip-connect-capacitor`; the API shape matches web.

## React Native and Expo setup checklist

Use this when the user is integrating `@hangtime/grip-connect-react-native`:

1. Install the package:

   ```sh
   npm install @hangtime/grip-connect-react-native
   ```

2. React Native CLI:
   - Run CocoaPods install in the `ios` folder.
   - Add `NSBluetoothAlwaysUsageDescription` to iOS app metadata.
   - Add Android Bluetooth permissions that match the target SDK.

3. Expo:
   - Expo Go is not sufficient; use a development build.
   - Add the `react-native-ble-plx` config plugin in `app.json` or `app.config.*`.
   - Rebuild native code after changing plugin config.

Minimal Expo plugin example:

```json
{
  "expo": {
    "plugins": [
      [
        "react-native-ble-plx",
        {
          "isBackgroundEnabled": true,
          "modes": ["peripheral", "central"],
          "bluetoothAlwaysPermission": "Allow $(PRODUCT_NAME) to connect to bluetooth devices"
        }
      ]
    ]
  }
}
```

4. Android runtime permissions:
   - Android 12+: request `BLUETOOTH_SCAN` and `BLUETOOTH_CONNECT`
   - Older Android: request `ACCESS_FINE_LOCATION`

5. Test on a physical device.

## Official docs links

If internet access is available and the agent needs official prose or examples, use these public pages:

- guide root: `https://stevie-ray.github.io/hangtime-grip-connect/guide`
- get started: `https://stevie-ray.github.io/hangtime-grip-connect/get-started`
- web: `https://stevie-ray.github.io/hangtime-grip-connect/platforms/web`
- capacitor: `https://stevie-ray.github.io/hangtime-grip-connect/platforms/capacitor`
- react native: `https://stevie-ray.github.io/hangtime-grip-connect/platforms/react-native`
- runtime: `https://stevie-ray.github.io/hangtime-grip-connect/platforms/runtime`
- cli: `https://stevie-ray.github.io/hangtime-grip-connect/platforms/cli`
