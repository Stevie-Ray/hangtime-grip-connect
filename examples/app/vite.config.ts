import { defineConfig, loadEnv, type Plugin } from "vite"
import { VitePWA } from "vite-plugin-pwa"

function frezCoefficientProxy(accessKey: string | undefined): Plugin {
  const middleware: NonNullable<Parameters<NonNullable<Plugin["configureServer"]>>[0]>["middlewares"]["use"] =
    function frezCoefficientMiddleware(request, response, next) {
      const url = new URL(request.url ?? "/", "http://localhost")
      if (url.pathname !== "/api/frez-dyno/coefficient") {
        next()
        return
      }

      void (async () => {
        response.setHeader("content-type", "application/json")
        if (!accessKey) {
          response.statusCode = 503
          response.end(JSON.stringify({ error: "Missing FREZ_ACCESS_KEY in examples/app/.env." }))
          return
        }

        const name = url.searchParams.get("name")?.trim()
        if (!name?.startsWith("FrezDyno-") || url.searchParams.size !== 1) {
          response.statusCode = 400
          response.end(JSON.stringify({ error: "Provide exactly one valid Frez Dyno name." }))
          return
        }

        try {
          const upstream = await fetch(`https://api.frez.app/v1/dyno/coefficient?name=${encodeURIComponent(name)}`, {
            headers: {
              "X-Frez-Access-Key": accessKey,
            },
          })
          response.statusCode = upstream.status
          response.end(await upstream.text())
        } catch {
          response.statusCode = 502
          response.end(JSON.stringify({ error: "Frez Dyno coefficient service is unavailable." }))
        }
      })()
    }

  return {
    name: "frez-dyno-coefficient-proxy",
    configureServer(server) {
      server.middlewares.use(middleware)
    },
    configurePreviewServer(server) {
      server.middlewares.use(middleware)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "")

  return {
    plugins: [
      frezCoefficientProxy(env.FREZ_ACCESS_KEY),
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
  }
})
