---
title: Force Measurement App
description:
  Stream force data and plot it live with Vite and @hangtime/grip-connect. Try the live demo, StackBlitz, or run
  locally.
aside: false
---

# Force Measurement App

Connect to your device, stream force data, and watch it plotted in real time. Ideal for testing the connection and
seeing mass/force values.

## What this example includes

- Device picker + connect/disconnect flow.
- Real-time force charting (`current`, `mean`, `peak`).
- Multiple training protocols: live data, peak force / MVC, endurance, RFD, repeaters, and critical force.
- Session settings and persistent preferences.
- PWA support with offline assets via `vite-plugin-pwa`.

## Live demo

[Force Measurement App](https://grip-connect.vercel.app/) - stream force from your device and see it plotted live.

## Source

[examples/app](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/app)

## Stack

- [Vite](https://vitejs.dev/)
- [TypeScript](https://www.typescriptlang.org/)
- [Chart.js](https://www.chartjs.org/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)

## Run locally

From the repo root:

```sh
npm install
npm run dev:examples:app
```

Direct workspace run:

```sh
npm run dev --workspace ./examples/app
```

Then open the local Vite URL in Chrome, Edge, or Opera on HTTPS/localhost.

## Try in StackBlitz

::: warning StackBlitz doesn't allow Bluetooth in the web editor

- Click the **Edit on StackBlitz** link below.
- Wait for the container to boot.
- In the top right, select **Open in New Tab**.
- In the new tab, click **Connect to Project**.

You can then connect to your force-sensing device.

:::

[Edit on StackBlitz](https://stackblitz.com/github/Stevie-Ray/hangtime-grip-connect/tree/main/examples/app?file=src%2Fdevices.ts)

<iframe src="https://stackblitz.com/github/Stevie-Ray/hangtime-grip-connect/tree/main/examples/app?embed=1&file=src%2Fdevices.ts&theme=dark" allow="bluetooth" width="100%" height="600px" style="margin-top: 2rem"></iframe>
