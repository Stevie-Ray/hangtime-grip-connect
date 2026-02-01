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

- Vite + TypeScript (or minimal HTML/JS)
- `@hangtime/grip-connect` (Motherboard or other supported device)
- Canvas or DOM for the game (ball, paddles, score)

## Pattern

1. Connect to the device and subscribe with `notify()` to get real-time `massTotal` (and optionally `massLeft` /
   `massRight` for split control).
2. Map force values to paddle position or velocity (e.g. scale `massTotal` to Y position).
3. Run the game loop: update ball, collision with paddles and walls, then render.
