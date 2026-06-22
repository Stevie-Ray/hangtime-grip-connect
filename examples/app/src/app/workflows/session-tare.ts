import { getActiveDevice } from "../../devices/session.js"
import { loadPreferences } from "../../settings/storage.js"
import type { AppState } from "../core/state.js"

function usesHardwareTare(device: NonNullable<ReturnType<typeof getActiveDevice>>): boolean {
  return "usesHardwareTare" in device && (device as { usesHardwareTare?: boolean }).usesHardwareTare === true
}

async function runFallbackTarePrompt(device: NonNullable<ReturnType<typeof getActiveDevice>>): Promise<boolean> {
  const confirmed = window.confirm(
    "One-time tare calibration is required before starting.\n\nKeep the device unloaded and still, then press OK to tare.",
  )
  if (!confirmed) return false

  const hardwareTare = usesHardwareTare(device)
  const streamForTare = typeof device.stream === "function" ? device.stream.bind(device) : undefined
  let streamStarted = false

  if (hardwareTare && streamForTare) {
    try {
      await streamForTare()
      streamStarted = true
    } catch (error: unknown) {
      window.alert(error instanceof Error ? error.message : "Failed to start stream for tare.")
      return false
    }
  }

  try {
    const started = device.tare?.(1000)
    if (!started) return false
    await new Promise((resolve) => setTimeout(resolve, hardwareTare ? 250 : 1000))
    return true
  } finally {
    if (streamStarted) {
      try {
        await device.stop?.()
      } catch {
        // Ignore stop errors during fallback tare cleanup.
      }
    }
  }
}

async function runGuidedTareDialog(): Promise<boolean> {
  const device = getActiveDevice()
  if (!device || typeof device.tare !== "function") return true

  const supportsDialog =
    typeof HTMLDialogElement !== "undefined" && typeof document.createElement("dialog").showModal === "function"
  if (!supportsDialog) {
    return runFallbackTarePrompt(device)
  }

  const dialog = document.createElement("dialog")
  dialog.className = "tare-dialog"
  dialog.innerHTML = `
    <form method="dialog" class="tare-dialog-form">
      <p>We're now ready, please tare your device before use.</p>
      <p class="tare-dialog-current"><strong data-tare-current>0.0</strong> <span data-tare-unit>kg</span></p>
      <p class="tare-dialog-status" data-tare-status>Starting live stream...</p>
      <menu class="tare-dialog-actions">
        <button type="button" value="cancel" data-tare-cancel>Cancel</button>
        <button type="button" value="confirm" data-tare-confirm disabled>Tare</button>
      </menu>
    </form>
  `
  document.body.appendChild(dialog)

  const currentElement = dialog.querySelector<HTMLElement>("[data-tare-current]")
  const statusElement = dialog.querySelector<HTMLElement>("[data-tare-status]")
  const unitElement = dialog.querySelector<HTMLElement>("[data-tare-unit]")
  const confirmButton = dialog.querySelector<HTMLButtonElement>("[data-tare-confirm]")
  const cancelButton = dialog.querySelector<HTMLButtonElement>("[data-tare-cancel]")
  const { unit } = loadPreferences()
  if (unitElement) unitElement.textContent = unit

  let done = false
  let streamStarted = false
  const hardwareTare = usesHardwareTare(device)

  const closeDialog = (ok: boolean): void => {
    if (done) return
    done = true
    dialog.close(ok ? "confirm" : "cancel")
  }

  device.notify((data) => {
    if (!currentElement) return
    const current = Number.isFinite(data.current) ? data.current : 0
    currentElement.textContent = current.toFixed(1)
  }, unit)

  const streamForTare = typeof device.stream === "function" ? device.stream.bind(device) : undefined
  const startStreamForTare = async (): Promise<void> => {
    if (!streamForTare) {
      if (statusElement) statusElement.textContent = "Device stream is unavailable. Running tare directly."
      if (confirmButton && !done) confirmButton.disabled = false
      return
    }

    try {
      await streamForTare()
      streamStarted = true
      if (statusElement && !done) {
        statusElement.textContent = "Live stream active. Keep the device unloaded, then press Tare."
      }
      if (confirmButton && !done) confirmButton.disabled = false
    } catch (error: unknown) {
      if (statusElement && !done) {
        statusElement.textContent = error instanceof Error ? error.message : "Failed to start stream for tare."
      }
    }
  }

  if (confirmButton) {
    confirmButton.onclick = async () => {
      if (done) return
      confirmButton.disabled = true
      if (statusElement) statusElement.textContent = "Running tare..."

      try {
        if (hardwareTare && streamForTare && !streamStarted) {
          throw new Error("Cannot tare before the live stream is active.")
        }

        const started = device.tare?.(1000)
        if (!started) {
          throw new Error("Tare could not be started.")
        }

        await new Promise((resolve) => setTimeout(resolve, hardwareTare ? 250 : 1000))
        if (statusElement) statusElement.textContent = "Tare complete."
        closeDialog(true)
      } catch (error: unknown) {
        if (statusElement) {
          statusElement.textContent = error instanceof Error ? error.message : "Tare failed."
        }
        confirmButton.disabled = false
      }
    }
  }

  if (cancelButton) {
    cancelButton.onclick = () => {
      closeDialog(false)
    }
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault()
    closeDialog(false)
  })

  dialog.showModal()

  const resultPromise = new Promise<boolean>((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        resolve(dialog.returnValue === "confirm")
      },
      { once: true },
    )
  })

  void startStreamForTare()

  const result = await resultPromise

  try {
    await device.stop?.()
  } catch {
    // Ignore stop errors during tare dialog cleanup.
  }
  device.notify(() => undefined, unit)
  dialog.remove()

  return result
}

export async function ensureOneTimeTareForSession(state: AppState): Promise<boolean> {
  const device = getActiveDevice()
  if (!device) return false
  if (state.isDeviceTared) return true
  if (typeof device.tare !== "function") return true

  const tared = await runGuidedTareDialog()
  if (tared) {
    state.isDeviceTared = true
  }
  return tared
}
