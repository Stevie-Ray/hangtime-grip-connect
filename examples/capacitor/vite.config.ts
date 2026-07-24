import { defineConfig, loadEnv } from "vite"

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, import.meta.dirname, "FREZ_")

  return {
    root: "./src",
    define: {
      "globalThis.process": JSON.stringify({ env: { FREZ_ACCESS_KEY: env["FREZ_ACCESS_KEY"] } }),
    },
    build: {
      outDir: "../dist",
      minify: false,
      emptyOutDir: true,
    },
  }
})
