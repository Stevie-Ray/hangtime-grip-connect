---
title: Flappy Bird
description: Control the bird with your force-sensing device. Pull on the hangboard to flap; release to fall.
---

# Flappy Bird example

Control the bird with your force-sensing device. Pull on the hangboard to flap; release to fall.

This example is a TypeScript port of [aaarafat's JS-Flappy-Bird](https://github.com/aaarafat/JS-Flappy-Bird), a JS and
HTML Canvas remake of the original Flappy Bird.

## Live demo

[Flappy Bird](https://grip-connect-flappy-bird.vercel.app/)

## Source

[examples/flappy-bird](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/flappy-bird)

## Stack

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- Canvas

## Pattern

1. Connect to the device and start streaming (or use `notify()` for real-time data).
2. Use `active()` or a threshold on `data.current` to detect a “flap” (user pull).
3. On flap, apply upward velocity in the game loop.
4. Gravity and collision logic run in the same loop.

## Run with Frez Dyno

For personal, local development, configure the Frez access key before starting the example:

```sh
cp examples/flappy-bird/.env.example examples/flappy-bird/.env.local
# Add FREZ_ACCESS_KEY to .env.local.
npm run dev:examples:flappy-bird
```

Do not deploy a web build containing a personal key. See [Frez Dyno](/devices/dyno) for access and distribution
requirements.
