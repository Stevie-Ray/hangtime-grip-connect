import { createRequire } from "node:module"
import { defineConfig } from "vitepress"
const require = createRequire(import.meta.url)
const pkg = require("@motherboard/core/package.json")

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Web Motherboard",
  description: "A Web Bluetooth API Griptonite Motherboard interface",
  base: "/motherboard/",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      {
        text: pkg.version,
        items: [
          {
            text: "Changelog",
            link: "https://github.com/Stevie-Ray/motherboard",
          },
        ],
      },
    ],

    sidebar: [
      {
        text: "Guide",
        items: [{ text: "Get started", link: "/get-started" }],
      }
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/Stevie-Ray/motherboard" }],
  },
})
