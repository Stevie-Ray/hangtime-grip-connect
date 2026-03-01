/**
 * Simple Screen Wake Lock API wrapper.
 * Prevents the device from dimming or locking the screen.
 * Requires secure context (HTTPS) and user activation.
 */

let sentinel: WakeLockSentinel | null = null
let wantsWakeLock = false

function getWakeLock(): { request(type: "screen"): Promise<WakeLockSentinel> } | undefined {
  const nav = navigator as Navigator & { wakeLock?: { request(type: "screen"): Promise<WakeLockSentinel> } }
  return nav.wakeLock
}

export function isWakeLockSupported(): boolean {
  return getWakeLock() !== undefined
}

export function isWakeLockActive(): boolean {
  return sentinel !== null
}

export async function requestWakeLock(): Promise<boolean> {
  const wakeLock = getWakeLock()
  if (!wakeLock) return false

  try {
    sentinel = await wakeLock.request("screen")
    wantsWakeLock = true

    sentinel.addEventListener("release", () => {
      sentinel = null
    })

    return true
  } catch {
    return false
  }
}

export async function releaseWakeLock(): Promise<void> {
  wantsWakeLock = false
  if (sentinel) {
    await sentinel.release()
    sentinel = null
  }
}

function setupVisibilityListener(): void {
  document.addEventListener("visibilitychange", async () => {
    if (document.visibilityState !== "visible" || !wantsWakeLock) return
    if (sentinel !== null) return

    const wakeLock = getWakeLock()
    if (!wakeLock) return

    try {
      sentinel = await wakeLock.request("screen")
      sentinel.addEventListener("release", () => {
        sentinel = null
      })
    } catch {
      // Re-acquisition failed (e.g. tab was backgrounded)
    }
  })
}

if (typeof document !== "undefined") {
  setupVisibilityListener()
}
