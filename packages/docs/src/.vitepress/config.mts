import { createRequire } from "node:module"
import { defineConfig } from "vitepress"
const require = createRequire(import.meta.url)
const pkg = require("@motherboard/core/package.json")

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Force-Sensing Climbing Training",
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
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/Stevie-Ray/hangtime-grip-connect" }],
  },
})
