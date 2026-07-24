---
title: Pong
description:
  Control the paddle with your force-sensing device. Pull to move the paddle; force level maps to position or speed.
---

# Pong example

Control the paddle with your force-sensing device. Pull to move the paddle; force level maps to position or speed.

This example is a TypeScript port of [gdube's pong-js](https://github.com/gdube/pong-js), a JavaScript remake of the
Pong game.

## Live demo

[Pong](https://hangtime-grip-connect-pong.vercel.app/)

## Source

[examples/pong](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/pong)

## Stack

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- Canvas

## Pattern

1. Connect to the device and subscribe with `notify()` to get real-time `data.current` (and optionally
   `data.distribution?.left` / `data.distribution?.right` for split control).
2. Map force values to paddle position or velocity (e.g. scale `data.current` to Y position).
3. Run the game loop: update ball, collision with paddles and walls, then render.

## Run with Frez Dyno

For personal, local development, configure the Frez access key before starting the example:

```sh
cp examples/pong/.env.example examples/pong/.env.local
# Add FREZ_ACCESS_KEY to .env.local.
npm run dev:examples:pong
```

Do not deploy a web build containing a personal key. See [Frez Dyno](/devices/dyno) for access and distribution
requirements.
