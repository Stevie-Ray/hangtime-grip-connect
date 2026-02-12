import { createRequire } from "node:module"
import { defineConfig } from "vitepress"
const require = createRequire(import.meta.url)
const pkg = require("@hangtime/grip-connect/package.json")

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "Grip Connect",
  description:
    "Web Bluetooth client for force-sensing hangboards, dynamometers, and LED system boards. Connect to Griptonite, Tindeq, PitchSix, Kilter Board, and more.",
  base: "/hangtime-grip-connect/",
  lang: "en-US",
  lastUpdated: false,
  cleanUrls: true,

  head: [
    ["meta", { name: "theme-color", content: "#3c8772" }],
    ["meta", { property: "og:type", content: "website" }],
    ["meta", { property: "og:title", content: "Grip Connect: Force-Sensing Climbing Training" }],
    [
      "meta",
      {
        property: "og:description",
        content:
          "Web Bluetooth client for force-sensing hangboards, dynamometers, and LED system boards. Connect, stream, and build.",
      },
    ],
    ["meta", { name: "twitter:card", content: "summary_large_image" }],
    ["meta", { name: "twitter:title", content: "Grip Connect" }],
    [
      "meta",
      {
        name: "twitter:description",
        content: "Web Bluetooth client for force-sensing hangboards, dynamometers, and LED system boards.",
      },
    ],
  ],

  themeConfig: {
    externalLinkIcon: true,
    nav: [
      { text: "Home", link: "/" },
      { text: "Platforms", link: "/platforms/" },
      { text: "API", link: "/api/" },
      { text: "Examples", link: "/examples/" },
      { text: "Devices", link: "/devices/" },

      {
        text: `v${pkg.version}`,
        items: [
          {
            text: "Changelog",
            link: "https://github.com/Stevie-Ray/hangtime-grip-connect/blob/main/packages/core/CHANGELOG.md",
          },
          {
            text: "GitHub",
            link: "https://github.com/Stevie-Ray/hangtime-grip-connect",
          },
        ],
      },
    ],

    sidebar: {
      "/": [
        {
          text: "Introduction",
          link: "/",
          items: [
            { text: "Get started", link: "/get-started" },
            { text: "Quick start guide", link: "/guide" },
            { text: "Adding a custom device", link: "/guide/custom-device" },
            { text: "Browser support", link: "/browser-support" },
          ],
        },
        {
          text: "Platforms",
          link: "/platforms/",
          items: [
            { text: "Web", link: "/platforms/web" },
            { text: "Capacitor", link: "/platforms/capacitor" },
            { text: "React Native", link: "/platforms/react-native" },
            { text: "Runtime", link: "/platforms/runtime" },
            { text: "CLI", link: "/platforms/cli" },
          ],
        },
        {
          text: "API",
          link: "/api/",
          items: [
            { text: "Exports", link: "/api/exports" },
            { text: "Device interface", link: "/api/device-interface" },
            {
              text: "Methods",
              link: "/api/methods/",
              collapsed: true,
              items: [
                { text: "connect", link: "/api/methods/connect" },
                { text: "disconnect", link: "/api/methods/disconnect" },
                { text: "isConnected", link: "/api/methods/is-connected" },
                { text: "notify", link: "/api/methods/notify" },
                { text: "active", link: "/api/methods/active" },
                { text: "read", link: "/api/methods/read" },
                { text: "write", link: "/api/methods/write" },
                { text: "tare", link: "/api/methods/tare" },
                { text: "download", link: "/api/methods/download" },
                { text: "battery", link: "/api/methods/battery" },
                { text: "stream", link: "/api/methods/stream" },
                { text: "led", link: "/api/methods/led" },
                { text: "stop", link: "/api/methods/stop" },
              ],
            },
          ],
        },
        {
          text: "Examples",
          link: "/examples/",
          items: [
            { text: "Chart", link: "/examples/chart" },
            { text: "Flappy Bird", link: "/examples/flappy-bird" },
            { text: "Kilter Board", link: "/examples/kilter-board" },
            { text: "Pong", link: "/examples/pong" },
            { text: "Runtime", link: "/examples/runtime" },
            { text: "Capacitor", link: "/examples/capacitor" },
            { text: "React Native", link: "/examples/react-native" },
          ],
        },
        {
          text: "Devices",
          link: "/devices/",
          items: [
            { text: "Climbro", link: "/devices/climbro" },
            { text: "Dyno", link: "/devices/dyno" },
            { text: "Entralpi", link: "/devices/entralpi" },
            { text: "Force Board", link: "/devices/forceboard" },
            { text: "Kilter Board", link: "/devices/kilterboard" },
            { text: "MotherBoard", link: "/devices/motherboard" },
            { text: "mySmartBoard", link: "/devices/mysmartboard" },
            { text: "PB-700BT", link: "/devices/pb-700bt" },
            { text: "Progressor", link: "/devices/progressor" },
            { text: "SmartBoard Pro", link: "/devices/smartboard-pro" },
            { text: "WH-C06", link: "/devices/wh-c06" },
          ],
        },
      ],
    },

    outline: {
      level: [2, 3, 4],
      label: "On this page",
    },
    search: {
      provider: "local",
    },
    editLink: {
      pattern: "https://github.com/Stevie-Ray/hangtime-grip-connect/edit/main/packages/docs/src/:path",
      text: "Edit this page on GitHub",
    },
    sidebarMenuLabel: "Menu",
    returnToTopLabel: "Back to top",
    darkModeSwitchLabel: "Appearance",
    docFooter: {
      prev: "Previous page",
      next: "Next page",
    },

    socialLinks: [
      {
        icon: "github",
        link: "https://github.com/Stevie-Ray/hangtime-grip-connect",
      },
    ],
    footer: {
      message: "Released under the BSD 2-Clause License.",
      copyright: "Copyright © Stevie-Ray Hartog",
    },
  },
})
