---
title: WH-C06
description: "Weiheng WH-C06: Bluetooth hanging scale, used by climbers as a cheap alternative to Tindeq / Force Board"
---

# Weiheng WH-C06

The [Weiheng WH-C06](https://weihengmanufacturer.com/products/wh-c06-bluetooth-300kg-hanging-scale/) is a Bluetooth
hanging scale sold as hand scales for farm weighing (300 kg capacity). Climbers use it as a low-cost alternative to
devices like the Tindeq Progressor and PitchSix Force Board for force measurement and hangboard training. Use the shared
[device interface](/api/device-interface) to connect and read force data.

## Basic usage

Force data streams automatically from advertisement packets once connected. Set `notify()` before connecting;
`connect()` starts `watchAdvertisements()`, and your callback receives data.

```ts
import { WHC06 } from "@hangtime/grip-connect"

const device = new WHC06()
device.notify((data) => console.log(data.current))

await device.connect(
  async () => {
    await new Promise((r) => setTimeout(r, 30000)) // session duration
    device.disconnect()
  },
  (err) => console.error(err),
)
```

## Advertisement scanning (watchAdvertisements)

Most devices send force data over a **GATT connection**: you connect, subscribe to a characteristic, and receive
notifications. The WH-C06 works differently. It does not stream data over GATT; it **broadcasts** weight data inside its
**Bluetooth advertisement packets** (in the manufacturer data). There is no characteristic to subscribe to; the device
just keeps advertising, and the browser must listen for those packets.

To receive that data in the browser, we use the Web Bluetooth API **watchAdvertisements()**. This API is experimental in
Chrome and is not enabled by default. If you see an error that `watchAdvertisements` is not supported, or the device
connects but no data appears:

1. Open Chrome and go to `chrome://flags/#enable-experimental-web-platform-features`.
2. Set **Experimental Web Platform features** to **Enabled**.
3. Restart Chrome.

After that, `connect()` will call `watchAdvertisements()` on the selected device and your `notify()` callback will
receive data from each advertisement packet.

## Methods

WH-C06 supports all [shared methods](/devices/#shared-methods) (connect, disconnect, isConnected, notify, active and
download). See [Device interface](/api/device-interface) for details. Data is received via advertisement scanning
(`watchAdvertisements`), not GATT notifications.

See [Devices](/devices/) and [Guide](/guide) for more.
