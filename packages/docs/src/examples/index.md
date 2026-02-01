# Examples

The monorepo includes several example apps that use Grip Connect. Use them as references for setup, connection flow, and
UI patterns. Each example uses the same [device interface](/api/device-interface): `connect`, `notify`, `stream`, and
optional `active` and `download`.

## What you'll learn

- **Chart (Vite)** - Connect, stream, and plot force data in real time; good first project.
- **Flappy Bird / Pong** - Map `notify()` data to game input (force → flap or paddle).
- **Kilter Board** - Use `KilterBoard` and `led()` to display routes on an LED board.
- **Runtime (Node)** - Use the CLI package in Node for scripting and data logging.

## Live demos

| Demo             | Description                                                                                                                      | Link                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Chart**        | Stream force from your device and watch it plotted live. Ideal for testing connection and seeing mass/force values in real time. | [grip-connect.vercel.app](https://grip-connect.vercel.app/)                             |
| **Flappy Bird**  | Pull on your hangboard to fly the bird; pull strength controls altitude. Game and workout in one.                                | [grip-connect-flappy-bird.vercel.app](https://grip-connect-flappy-bird.vercel.app/)     |
| **Kilter Board** | Send a route from the browser. Your Kilter or compatible LED board lights up the problem on the wall.                            | [grip-connect-kilter-board.vercel.app](https://grip-connect-kilter-board.vercel.app/)   |
| **Pong**         | Move the paddle by applying force to your device. Minimal game loop that shows streamed force as input.                          | [hangtime-grip-connect-pong.vercel.app](https://hangtime-grip-connect-pong.vercel.app/) |

## Built with Grip Connect

| App                                                                                   | Description                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[HangTime](https://play.google.com/store/apps/details?id=nl.stevie.ray.hangtime)**  | Hangboard training for climbers: create and customize workouts, track progress, 250+ hangboards from 100+ brands. [Google Play](https://play.google.com/store/apps/details?id=nl.stevie.ray.hangtime) · [App Store](https://apps.apple.com/us/app/hangtime-hangboard-training/id1631706818). |
| **[Heli-Hero](https://play.google.com/store/apps/details?id=nl.stevie.ray.helihero)** | Mobile game that uses a Griptonite Motherboard as the controller: fly a helicopter through mountain terrain. [Google Play](https://play.google.com/store/apps/details?id=nl.stevie.ray.helihero).                                                                                            |

## Source and docs

| Example            | Repo path               | Doc                                                        |
| ------------------ | ----------------------- | ---------------------------------------------------------- |
| **Chart (Vite)**   | `examples/chart`        | [Vite example](/examples/vite): includes StackBlitz embed. |
| **Flappy Bird**    | `examples/flappy-bird`  | [Flappy Bird](/examples/flappy-bird)                       |
| **Kilter Board**   | `examples/kilter-board` | [Kilter Board](/examples/kilter-board)                     |
| **Pong**           | `examples/pong`         | [Pong](/examples/pong)                                     |
| **Runtime (Node)** | `examples/runtime`      | [Runtime](/examples/runtime): CLI / Node usage.            |
| **Capacitor**      | `examples/capacitor`    | Capacitor demo app.                                        |
| **React Native**   | `examples/reactnative`  | Expo app using `@hangtime/grip-connect-react-native`.      |

## Quick run

From the repo root:

```sh
npm install
cd examples/chart && npm run dev
```

Replace `chart` with `flappy-bird`, `kilter-board`, `pong`, or `runtime` as needed. See each example’s README and doc
page for details.

## External resources

- [Web Bluetooth specification](https://github.com/WebBluetoothCG/web-bluetooth): W3C Community Group spec, use cases,
  implementation status.
- [Chrome Bluetooth internals](chrome://bluetooth-internals/#devices): Inspect BLE devices and GATT services (Chrome
  only).
- [unpkg CDN](https://unpkg.com/@hangtime/grip-connect@latest?module): Load Grip Connect in the browser without a build
  step.
- [PitchSix Force Board API (PDF)](https://cdn.shopify.com/s/files/1/0249/5525/6922/files/Force_Board_Public_API_1.0.pdf):
  Official Force Board GATT docs.
- [Tindeq Progressor API](https://tindeq.com/progressor_api/): Progressor Bluetooth interface, control/data point, TLV
  format.
- [Crimpdeq](https://github.com/crimpdeq): Open-source Tindeq-compatible hardware; works with the Progressor class.
- [Mito](https://github.com/jvasilakes/mito): Open-source force gauge that advertises as Progressor; works with the
  Progressor class.
