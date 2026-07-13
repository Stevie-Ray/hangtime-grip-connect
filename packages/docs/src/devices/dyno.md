# Frez Dyno

The [Frez Dyno](https://shop.frez.app/products/pre-order-frez-dyno) is an upcoming Bluetooth dynamometer for grip
strength and isometric training from [Frez](https://www.frez.app/) (formerly ClimbHarder). It is currently available for
pre-order and is not yet on the market. Once released, it can be used for peak force, endurance, and critical force
testing.

::: info Pre-order status

The Frez Dyno is not yet sold or available on the market. Support is in progress and device-specific API details will be
added when the hardware is released and support is finalized.

:::

Use the shared [device interface](/api/device-interface) and [Quick start guide](/guide) for connection and streaming
patterns.

Available factory calibration is loaded before raw measurements start. The lookup tries the device serial first, then
its Bluetooth remote ID. Capacitor and React Native read the standard serial-number characteristic directly and use it
automatically before `stream()` starts. Web Bluetooth blocks that characteristic, so a browser integration may need to
pass the actual serial explicitly.

```ts
const dyno = new FrezDyno({ deviceSerialNumber: "actual-device-serial" })
```

When the example app cannot read the serial, the tare dialog accepts the actual serial and retries the factory lookup
without reconnecting. The value is saved against that browser device ID for later sessions, so it cannot be reused for
another Frez Dyno. If the calibration service has no record for that serial either, configure the device-specific
raw/weight points under **Settings > Calibration**.

The device uses the custom service `da8a6c41-154b-4b9a-9b00-2f84dfcebfe9`, notifications on `...42`, and acknowledged
command writes on `...43`. Its one-byte commands are `0x01` to start, `0x02` to stop, and `0xff` to shut down. Tare is
performed in software while measurement is active.

| Service                                | Characteristic                         | Usage                       |
| -------------------------------------- | -------------------------------------- | --------------------------- |
| `da8a6c41-154b-4b9a-9b00-2f84dfcebfe9` | `da8a6c42-154b-4b9a-9b00-2f84dfcebfe9` | Weight notifications        |
| `da8a6c41-154b-4b9a-9b00-2f84dfcebfe9` | `da8a6c43-154b-4b9a-9b00-2f84dfcebfe9` | Acknowledged command writes |
| `0000180a-0000-1000-8000-00805f9b34fb` | `00002a25-0000-1000-8000-00805f9b34fb` | Serial number               |
| `0000180a-0000-1000-8000-00805f9b34fb` | `00002a28-0000-1000-8000-00805f9b34fb` | Software revision           |
| `0000180f-0000-1000-8000-00805f9b34fb` | `00002a19-0000-1000-8000-00805f9b34fb` | Battery level               |

Weight notifications begin with a two-byte header. Only message type `0x01` is processed; each following sample is a
little-endian signed 32-bit ADC value plus an unsigned 32-bit device counter. The example app processes at most ten
samples per notification and scales the counter using the calibration record's `actual_sample_rate` (250 Hz fallback).
