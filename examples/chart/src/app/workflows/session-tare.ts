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

  const started = device.tare?.(1000)
  if (!started) return false
  if (!usesHardwareTare(device)) {
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }
  return true
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
    
      <menu class="tare-dialog-actions">
        <button type="button" value="confirm" data-tare-confirm>Tare</button>
      </menu>
    </form>
  `
  document.body.appendChild(dialog)

  const currentElement = dialog.querySelector<HTMLElement>("[data-tare-current]")
  const statusElement = dialog.querySelector<HTMLElement>("[data-tare-status]")
  const unitElement = dialog.querySelector<HTMLElement>("[data-tare-unit]")
  const confirmButton = dialog.querySelector<HTMLButtonElement>("[data-tare-confirm]")
  const { unit } = loadPreferences()
  if (unitElement) unitElement.textContent = unit

  let done = false
  const closeDialog = (ok: boolean): void => {
    if (done) return
    done = true
    dialog.close(ok ? "confirm" : "cancel")
  }

  const streamFn = device.stream
  if (typeof streamFn === "function") {
    try {
      await streamFn()
      if (statusElement) statusElement.textContent = "Live stream active."
    } catch (error: unknown) {
      if (statusElement) {
        statusElement.textContent = error instanceof Error ? error.message : "Failed to start stream for tare."
      }
    }
  } else if (statusElement) {
    statusElement.textContent = "Device stream is unavailable. Running tare directly."
  }

  device.notify((data) => {
    if (!currentElement) return
    const current = Number.isFinite(data.current) ? data.current : 0
    currentElement.textContent = current.toFixed(1)
  }, unit)

  if (confirmButton) {
    confirmButton.onclick = async () => {
      if (done) return
      confirmButton.disabled = true
      if (statusElement) statusElement.textContent = "Running tare..."

      try {
        const started = device.tare?.(1000)
        if (!started) {
          throw new Error("Tare could not be started.")
        }
        if (!usesHardwareTare(device)) {
          await new Promise((resolve) => setTimeout(resolve, 1000))
        }
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

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault()
  })

  dialog.showModal()

  const result = await new Promise<boolean>((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        resolve(dialog.returnValue === "confirm")
      },
      { once: true },
    )
  })

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
