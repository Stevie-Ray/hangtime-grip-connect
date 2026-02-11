import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Grip Connect - Flappy Bird",
        short_name: "Flappy Bird",
        description: "Web Bluetooth API force-sensing Flappy Bird game for climbers",
        theme_color: "#242424",
        icons: [
          { src: "img/pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "img/pwa-512x512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
})
