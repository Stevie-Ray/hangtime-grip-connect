# Frez Dyno

The [Frez Dyno](https://shop.frez.app/products/pre-order-frez-dyno) streams signed raw ADC values at 250 Hz. Grip
Connect follows the official Frez protocol v1: it fetches the device coefficient, subscribes before Start, establishes
tare from the first 100 unloaded samples, and reconstructs the sample timeline from the device elapsed time.

## Developer Portal and access key

Frez provides API access through the [Frez Dyno Developer Program](https://developers.frez.app/en). The standard
Developer Program key is for a personal, non-commercial application.

::: warning Personal use only

The standard agreement does not permit commercial development or use, including paid apps, subscriptions, advertising,
work for a company, gym, coach, team, clinic, client, or a product intended for commercial release. Read the current
[Frez Developer Agreement](https://developers.frez.app/en/policy). Contact [support@frez.app](mailto:support@frez.app)
before developing or testing a commercial integration.

:::

### Get a personal, non-commercial key

Follow the instructions in the [Frez Developer Portal](https://developers.frez.app/en) to enroll and issue a personal,
non-commercial key. Manage the key and Personal API devices on the
[Access key page](https://developers.frez.app/en/dashboard/access-key), and manage Web Bluetooth device names on the
[Allowlist page](https://developers.frez.app/en/dashboard/allowlist). Keep the key secret and out of distributed client
bundles.

## Use the key in a Grip Connect project

### 1. Install the package for your platform

```sh
# Web
npm install @hangtime/grip-connect

# Capacitor
npm install @hangtime/grip-connect-capacitor

# React Native or Expo
npm install @hangtime/grip-connect-react-native
```

Capacitor and React Native require native Bluetooth configuration and a physical device. Expo requires a development
build; Expo Go cannot load the native BLE module.

### 2. Add the key to your local environment

Create a local environment file in your project root:

```dotenv
FREZ_ACCESS_KEY=your-access-key
```

Add the file to `.gitignore`. Grip Connect reads `FREZ_ACCESS_KEY` or `EXPO_PUBLIC_FREZ_ACCESS_KEY` automatically when
your project loads the environment file into `process.env`.

### 3. Create the Frez Dyno

Import `FrezDyno` from the package installed in step 1. This example uses the web package; change only the package name
for Capacitor or React Native:

```ts
import { FrezDyno } from "@hangtime/grip-connect"

const dyno = new FrezDyno()
```

Grip Connect reads the device serial on Capacitor and React Native, or its allowlisted Bluetooth name on web, and then
uses the key to load the correct coefficient automatically when `stream()` starts.

::: warning Keep the key private

This direct setup is for personal, non-distributed development. Do not publish a web or mobile build containing the key.
For a distributed application, keep the key on an authenticated server and provide a custom `coefficientLookup` to
`FrezDyno`.

:::

## Connection and measurement

Create the configured device, subscribe, and connect. Keep the Dyno unloaded while the first 100 samples establish tare:

```ts
dyno.notify((measurement) => {
  console.log(measurement.current, measurement.unit, measurement.timestamp)
})

await dyno.connect()

try {
  await dyno.stream()
  // Keep the device unloaded until measurements begin arriving.
} finally {
  await dyno.stop()
  await dyno.disconnect()
}
```

Native transports read `0x2A25` and request the coefficient by `serial`. Web Bluetooth cannot expose that
characteristic, so web clients use the allowlisted Bluetooth `name`. The official coefficient API accepts exactly one of
these identifiers.

The simple client-side conversion is:

```text
tare_adc = average(first 100 unloaded samples)
weight_kg = a × (raw_adc - tare_adc)
force_N = weight_kg × 9.80665
```

Call `tare()` during an active measurement to discard the current tare and collect another 100 unloaded samples.

## Protocol v1

| Service                                | Characteristic                         | Usage                       |
| -------------------------------------- | -------------------------------------- | --------------------------- |
| `da8a6c41-154b-4b9a-9b00-2f84dfcebfe9` | `da8a6c42-154b-4b9a-9b00-2f84dfcebfe9` | 74-byte notifications       |
| `da8a6c41-154b-4b9a-9b00-2f84dfcebfe9` | `da8a6c43-154b-4b9a-9b00-2f84dfcebfe9` | Acknowledged command writes |
| `0000180a-0000-1000-8000-00805f9b34fb` | `00002a25-0000-1000-8000-00805f9b34fb` | Serial number               |
| `0000180a-0000-1000-8000-00805f9b34fb` | `00002a28-0000-1000-8000-00805f9b34fb` | Firmware/API version        |
| `0000180f-0000-1000-8000-00805f9b34fb` | `00002a19-0000-1000-8000-00805f9b34fb` | Battery percentage          |

Command frames contain an opcode followed by a reserved zero byte:

- Start: `01 00`
- Stop: `02 00`
- Power off: `FF 00`

Each notification is exactly:

```text
[0x01] [0x00] + 9 × [int32LE raw_adc] [uint32LE elapsed_ms]
```

Capacitor and React Native request MTU 85 when the platform supports it. Grip Connect rejects truncated packets,
non-zero reserved bytes, unexpected response codes, and duplicate or decreasing device timestamps instead of guessing.
