# Integration Workflows

Use this file after the platform is known and you need concrete guidance that works without a local repo checkout.

## Shared integration pattern

Most integrations follow the same structure:

```ts
const device = new DeviceClass()

device.notify((data) => {
  console.log(data.current, data.peak, data.mean, data.unit)
})

await device.connect(
  async () => {
    await device.stream?.(30000)
    device.disconnect()
  },
  (error) => console.error(error.message),
)
```

Shared expectations:

- `notify()` handles live force or mass updates.
- `active()` is optional when the user needs threshold-based "user is pulling" detection.
- `stream()` is the common entry point for time-based capture when the chosen device supports it.
- `download()` exports CSV, JSON, or XML.
- `battery()`, `tare()`, `led()`, and `stop()` are device-specific and should only be suggested when the chosen device
  supports them.

## Web apps

- Import from `@hangtime/grip-connect`.
- Trigger `connect()` from a click or tap handler.
- Mention the browser requirement up front: Chrome, Edge, or Opera on HTTPS or localhost.
- Use this package for dashboards, games, browser tools, or LED board web apps.

Starter snippet:

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()

device.notify((data) => {
  console.log(data.current, data.peak, data.mean, data.unit)
})

document.querySelector("#connect")?.addEventListener("click", async () => {
  await device.connect(
    async () => {
      await device.stream?.(30000)
      device.disconnect()
    },
    (error) => console.error(error.message),
  )
})
```

## Capacitor apps

- Import from `@hangtime/grip-connect-capacitor`.
- Keep the API guidance aligned with the web docs, but surface native BLE setup before app code.
- Treat simulator testing as insufficient for BLE; use a physical device in guidance.

Starter snippet:

```ts
import { Motherboard } from "@hangtime/grip-connect-capacitor"

const device = new Motherboard()

device.notify((data) => {
  console.log(data.current, data.unit)
})

export async function connectMotherboard(): Promise<void> {
  await device.connect(
    async () => {
      await device.stream?.(30000)
      device.disconnect()
    },
    (error) => console.error(error.message),
  )
}
```

## React Native and Expo apps

- Import from `@hangtime/grip-connect-react-native`.
- Call out Expo Development Build requirements early.
- Keep examples aligned with the same device API used on web and Capacitor.

Starter snippet:

```ts
import { Motherboard } from "@hangtime/grip-connect-react-native"

const device = new Motherboard()

device.notify((data) => {
  console.log(data.current, data.unit)
})

export async function connectMotherboard(): Promise<void> {
  await device.connect(
    async () => {
      await device.stream?.(30000)
      device.disconnect()
    },
    (error) => console.error(error.message),
  )
}
```

Android runtime permission example:

```ts
import { PermissionsAndroid, Platform } from "react-native"

export async function requestBluetoothPermissions(): Promise<boolean> {
  if (Platform.OS !== "android") return true

  const scan = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN)
  const connect = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT)
  const location = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)

  return scan === "granted" && connect === "granted" && location === "granted"
}
```

## Runtime scripts

- Use runtime when the user wants logging, automation, headless scripts, or file export to disk.
- Import from `@hangtime/grip-connect-runtime`.
- Mention that `download()` writes files to disk instead of triggering a browser download.

Minimal pattern:

```ts
import { Progressor } from "@hangtime/grip-connect-runtime"

const device = new Progressor()

device.notify((data) => {
  console.log(data.current, data.unit)
})

await device.connect(
  async () => {
    await device.stream?.(30000)
    device.download("json")
    device.disconnect()
  },
  (error) => console.error(error.message),
)
```

## CLI workflows

- Prefer CLI commands when the user wants manual testing, live charts, info, tare, or export without building an app.
- If the user is deciding between CLI and Runtime, recommend CLI for operator workflows and Runtime for automation.

Common commands:

```sh
npx @hangtime/cli
npx @hangtime/cli list
npx @hangtime/cli progressor live
npx @hangtime/cli progressor info
```

## Starting point recommendations

Use these defaults when the user treats Grip Connect as a starting point:

- Use `Motherboard` for a general-purpose starter snippet because it demonstrates `notify()`, `battery()`, `stream()`,
  and optional `led()`.
- Use `Progressor` when the user is building test protocols, MVC, RFD, or scripting workflows.
- Use Runtime when the user wants automation or file export to disk.
- Use CLI when the user wants to validate hardware first before writing application code.

## Device-specific routing

Before giving device-specific instructions, read the support notes in
[devices-and-troubleshooting.md](devices-and-troubleshooting.md). If internet access is available, the public device
docs live under `https://stevie-ray.github.io/hangtime-grip-connect/devices/`.
