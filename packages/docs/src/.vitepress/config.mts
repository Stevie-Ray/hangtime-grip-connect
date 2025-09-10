import { createRequire } from "node:module"
import { defineConfig } from "vitepress"
const require = createRequire(import.meta.url)
const pkg = require("@hangtime/grip-connect/package.json")

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Grip Connect",
  description:
    "A client that can establish connections with various Force-Sensing Hangboards/Plates used by climbers for strength measurement",
  base: "/hangtime-grip-connect/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: pkg.version,
        items: [
          {
            text: "Changelog",
            link: "https://github.com/Stevie-Ray/hangtime-grip-connect",
          },
        ],
      },
    ],

    sidebar: [
      {
        text: "Introduction",
        items: [{ text: "Get started", link: "/get-started" }],
      },
      {
        text: "Integrations",
        items: [{ text: "Vite", link: "/examples/vite" }],
      },
      {
        text: "Devices",
        link: "/devices/",
        items: [
          { text: "Climbro", link: "/devices/climbro" },
          { text: "DUE", link: "/devices/due" },
          { text: "Dyno", link: "/devices/dyno" },
          { text: "Entralpi", link: "/devices/entralpi" },
          { text: "Force Board", link: "/devices/forceboard" },
          { text: "Kilter Board", link: "/devices/kilterboard" },
          { text: "MotherBoard", link: "/devices/motherboard" },
          { text: "mySmartBoard", link: "/devices/mysmartboard" },
          { text: "Progressor", link: "/devices/progressor" },
          { text: "SmartBoard Pro", link: "/devices/smartboard-pro" },
          { text: "WH-C06", link: "/devices/wh-c06" },
        ],
      },
    ],

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/Stevie-Ray/hangtime-grip-connect",
      },
    ],
  },
})
