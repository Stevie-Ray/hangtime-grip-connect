# Examples

The monorepo includes several example apps that use the library. Use them as references for setup, connection flow, and
UI patterns. Each example uses the same [device interface](/api/device-interface): `connect`, `notify`, `stream`, and
optional `active` and `download`.

## Available examples

- **Chart** - Connect, stream, and plot force data in real time; good first project.
- **Flappy Bird / Pong** - Map `notify()` data to game input (force → flap or paddle).
- **Kilter Board** - Use `KilterBoard` and `led()` to display routes on an LED board.
- **Runtime** - Use the CLI package in Node for scripting and data logging.
- **Capacitor** - Hybrid app: pick a device, connect over BLE, stream force. Web or native iOS/Android.
- **React Native** - Expo app with training modes (peak force, endurance, timed hangs). Native iOS/Android.

## Live demos

| Demo             | Description                                                                                                                      | Link                                                                                    |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| **Chart**        | Stream force from your device and watch it plotted live. Ideal for testing connection and seeing mass/force values in real time. | [grip-connect.vercel.app](https://grip-connect.vercel.app/)                             |
| **Flappy Bird**  | Pull on your hangboard to fly the bird; pull strength controls altitude. Game and workout in one.                                | [grip-connect-flappy-bird.vercel.app](https://grip-connect-flappy-bird.vercel.app/)     |
| **Kilter Board** | Send a route from the browser. Your Kilter or compatible LED board lights up the problem on the wall.                            | [grip-connect-kilter-board.vercel.app](https://grip-connect-kilter-board.vercel.app/)   |
| **Pong**         | Move the paddle by applying force to your device. Minimal game loop that shows streamed force as input.                          | [hangtime-grip-connect-pong.vercel.app](https://hangtime-grip-connect-pong.vercel.app/) |
| **Capacitor**    | Hybrid app: pick a device, connect over BLE, stream force. Run in the browser or as a native iOS/Android build.                  | [grip-connect-capacitor.vercel.app](https://grip-connect-capacitor.vercel.app/)         |
| **React Native** | Expo app with training modes (peak force, endurance, timed hangs). Native iOS/Android only; run from the repo (no web demo).     | N/A                                                                                     |

## Built with it

| App                                                                                   | Description                                                                                                                                                                                                                                                                                  |
| ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **[HangTime](https://play.google.com/store/apps/details?id=nl.stevie.ray.hangtime)**  | Hangboard training for climbers: create and customize workouts, track progress, 250+ hangboards from 100+ brands. [Google Play](https://play.google.com/store/apps/details?id=nl.stevie.ray.hangtime) · [App Store](https://apps.apple.com/us/app/hangtime-hangboard-training/id1631706818). |
| **[Heli-Hero](https://play.google.com/store/apps/details?id=nl.stevie.ray.helihero)** | Mobile game that uses a Griptonite Motherboard as the controller: fly a helicopter through mountain terrain. [Google Play](https://play.google.com/store/apps/details?id=nl.stevie.ray.helihero).                                                                                            |

## Source and docs

| Example          | Repo path               | Doc                                                                   |
| ---------------- | ----------------------- | --------------------------------------------------------------------- |
| **Chart**        | `examples/chart`        | [Chart](/examples/chart): includes StackBlitz embed.                  |
| **Flappy Bird**  | `examples/flappy-bird`  | [Flappy Bird](/examples/flappy-bird)                                  |
| **Kilter Board** | `examples/kilter-board` | [Kilter Board](/examples/kilter-board)                                |
| **Pong**         | `examples/pong`         | [Pong](/examples/pong)                                                |
| **Runtime**      | `examples/runtime`      | [Runtime](/examples/runtime): Node, Deno, Bun usage.                  |
| **Capacitor**    | `examples/capacitor`    | [Capacitor](/examples/capacitor): hybrid app, device picker, BLE.     |
| **React Native** | `examples/reactnative`  | [React Native](/examples/react-native): Expo app with training modes. |

## Quick run

From the repo root:

```sh
npm install
npm run dev:examples:chart
```

Replace `chart` with `flappy-bird`, `kilter-board`, `pong`, or `capacitor` (or `reactnative`) as needed. For Runtime
(Node), use `npm run start --workspace ./examples/runtime`. See each example’s doc page for run instructions.
