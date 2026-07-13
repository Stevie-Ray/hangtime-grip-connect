import { registerSW } from "virtual:pwa-register"

let reloadRequested = false

registerSW({
  immediate: true,
  onNeedReload: () => {
    if (reloadRequested) return
    reloadRequested = true
    window.location.reload()
  },
  onRegisterError: (error: unknown) => {
    const message = error instanceof Error ? error.message : String(error)
    console.warn(`@hangtime/grip-connect service worker registration failed: ${message}`)
  },
})
