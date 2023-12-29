import { createRequire } from "node:module"
import { defineConfig } from "vitepress"
const require = createRequire(import.meta.url)
const pkg = require("@motherboard/core/package.json")

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Motherboard",
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
        text: "Introduction",
        items: [{ text: "Get started", link: "/get-started" }],
      },
      {
        text: "Integrations",
        items: [{ text: "Vite", link: "/examples/vite" }],
      },
    ],

    socialLinks: [{ icon: "github", link: "https://github.com/Stevie-Ray/motherboard" }],
  },
})
