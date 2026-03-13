import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  plugins: [
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Grip Connect",
        short_name: "Grip Connect",
        description: "Web Bluetooth API force-sensing strength analysis for climbers",
        theme_color: "#242424",
        icons: [
          { src: "img/pwa-192x192.png", sizes: "192x192", type: "image/png", purpose: "any maskable" },
          { src: "img/pwa-512x512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
        shortcuts: [
          {
            name: "Live Data",
            short_name: "Live Data",
            description: "Open the real-time data chart",
            url: "/?route=live-data&screen=chart",
          },
          {
            name: "Peak Force / MVC",
            short_name: "Peak Force",
            description: "Start the peak force measurement flow",
            url: "/?route=peak-force-mvc",
          },
          {
            name: "Endurance",
            short_name: "Endurance",
            description: "Open the endurance measurement flow",
            url: "/?route=endurance",
          },
          {
            name: "RFD",
            short_name: "RFD",
            description: "Open the rate of force development test",
            url: "/?route=rfd",
          },
          {
            name: "Repeaters",
            short_name: "Repeaters",
            description: "Open the repeaters workout builder",
            url: "/?route=repeaters",
          },
          {
            name: "Critical Force",
            short_name: "Critical Force",
            description: "Open the critical force test",
            url: "/?route=critical-force",
          },
        ],
      },
    }),
  ],
})
