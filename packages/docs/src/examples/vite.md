---
title: Chart (Vite)
description:
  Stream force data and plot it live with Vite and @hangtime/grip-connect. Try the live demo, StackBlitz, or run
  locally.
aside: false
---

# Chart (Vite)

Connect to your device, stream force data, and watch it plotted in real time. Ideal for testing the connection and
seeing mass/force values.

## Live demo

[Chart](https://grip-connect.vercel.app/) - stream force from your device and see it plotted live.

## Source

[examples/chart](https://github.com/Stevie-Ray/hangtime-grip-connect/tree/main/examples/chart)

## Stack

- Vite + TypeScript
- `@hangtime/grip-connect` (Motherboard or other supported device)
- [Chart.js](https://www.chartjs.org/) for live force/mass plotting

## Try in StackBlitz

::: warning StackBlitz doesn't allow Bluetooth in the web editor

- Click the **Edit on StackBlitz** link below.
- Wait for the container to boot.
- In the top right, select **Open in New Tab**.
- In the new tab, click **Connect to Project**.

You can then connect to your force-sensing device.

:::

[Edit on StackBlitz](https://stackblitz.com/github/Stevie-Ray/hangtime-grip-connect/tree/main/examples/chart?file=src%2Fdevices.ts)

<iframe src="https://stackblitz.com/github/Stevie-Ray/hangtime-grip-connect/tree/main/examples/chart?embed=1&file=src%2Fdevices.ts&theme=dark" allow="bluetooth" width="100%" height="600px" style="margin-top: 2rem"></iframe>
