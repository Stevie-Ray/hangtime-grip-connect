# Frez Dyno

The [Frez Dyno](https://shop.frez.app/products/pre-order-frez-dyno) streams signed raw ADC values at 250 Hz. Grip
Connect follows the official Frez protocol v1: it fetches the device coefficient, subscribes before Start, establishes
tare from the first 100 unloaded samples, and reconstructs the sample timeline from the device elapsed time.

## Access key

Create a Frez Developer Program access key and keep it out of source control:

```dotenv
FREZ_ACCESS_KEY=your-access-key
```

`lookupFrezDynoCoefficient()` and `new FrezDyno()` read `FREZ_ACCESS_KEY` in runtimes that expose `process.env`. An
`.env` file is not loaded automatically; start Node 22+ with `node --env-file=.env app.js`, use `dotenv`, or use your
runtime's equivalent. You can also inject the key explicitly in a native application:

```ts
const dyno = new FrezDyno({
  accessKey: process.env.FREZ_ACCESS_KEY,
})
```

Treat the access key like a password. A browser bundle cannot keep it private. Web applications should call the Frez API
through a server-side endpoint and provide that endpoint as `coefficientLookup`:

```ts
const dyno = new FrezDyno({
  coefficientLookup: async ({ deviceName }) => {
    const response = await fetch(`/api/frez-dyno/coefficient?name=${encodeURIComponent(deviceName ?? "")}`)
    const body = (await response.json()) as { a?: unknown }
    if (!response.ok || typeof body.a !== "number") {
      throw new Error("Frez Dyno coefficient request failed")
    }
    return body.a
  },
})
```

The force-measurement example includes this proxy for local development. Copy `examples/app/.env.example` to
`examples/app/.env` and set `FREZ_ACCESS_KEY`; Vite keeps the key on its development server.

## Connection and measurement

Keep the Dyno unloaded while the first 100 samples establish tare:

```ts
const dyno = new FrezDyno()

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
