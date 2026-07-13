import { getActiveDevice } from "../../devices/session.js"
import { formatDeviceIdentifiers, getBluetoothDeviceId, readDeviceIdentifiers } from "../../devices/diagnostics.js"
import {
  loadFrezDynoSerialNumber,
  loadPreferences,
  parseFrezDynoSerialNumber,
  saveFrezDynoSerialNumber,
} from "../../settings/storage.js"
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

  if (streamForTare) {
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
      <pre class="tare-dialog-device-identifiers" data-tare-device-identifiers hidden></pre>
      <div class="tare-dialog-frez-recovery" data-tare-frez-recovery hidden>
        <p>Chrome could not read this Frez Dyno's serial number, so its factory calibration could not be found.</p>
        <label>
          Actual Frez serial number
          <input type="text" autocomplete="off" placeholder="Serial from the device label or Frez app" data-tare-frez-serial />
        </label>
        <button type="button" data-tare-frez-retry>Save serial and retry</button>
        <p>Alternatively, cancel and open Settings &gt; Calibration to enter device-specific raw/weight points.</p>
      </div>
      <menu class="tare-dialog-actions">
        <button type="button" value="cancel" data-tare-cancel>Cancel</button>
        <button type="button" value="confirm" data-tare-confirm disabled>Tare</button>
      </menu>
    </form>
  `
  document.body.appendChild(dialog)

  const currentElement = dialog.querySelector<HTMLElement>("[data-tare-current]")
  const statusElement = dialog.querySelector<HTMLElement>("[data-tare-status]")
  const identifiersElement = dialog.querySelector<HTMLElement>("[data-tare-device-identifiers]")
  const frezRecoveryElement = dialog.querySelector<HTMLElement>("[data-tare-frez-recovery]")
  const frezSerialInput = dialog.querySelector<HTMLInputElement>("[data-tare-frez-serial]")
  const frezRetryButton = dialog.querySelector<HTMLButtonElement>("[data-tare-frez-retry]")
  const unitElement = dialog.querySelector<HTMLElement>("[data-tare-unit]")
  const confirmButton = dialog.querySelector<HTMLButtonElement>("[data-tare-confirm]")
  const cancelButton = dialog.querySelector<HTMLButtonElement>("[data-tare-cancel]")
  const { unit } = loadPreferences()
  const frezDynoDeviceId = getBluetoothDeviceId(device)
  const frezDynoSerialNumber = loadFrezDynoSerialNumber(frezDynoDeviceId)
  if (unitElement) unitElement.textContent = unit
  if (frezSerialInput && frezDynoSerialNumber) frezSerialInput.value = frezDynoSerialNumber

  let done = false
  let streamStarted = false
  const hardwareTare = usesHardwareTare(device)

  const closeDialog = (ok: boolean): void => {
    if (done) return
    done = true
    dialog.close(ok ? "confirm" : "cancel")
  }

  const showDeviceIdentifiers = async (): Promise<void> => {
    if (!identifiersElement || done) return
    const identifiers = await readDeviceIdentifiers(device)
    if (done) return
    identifiersElement.textContent = formatDeviceIdentifiers(identifiers)
    identifiersElement.hidden = false
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
      const canRecoverFrezCalibration =
        typeof device.setDeviceSerialNumber === "function" &&
        error instanceof Error &&
        error.message.includes("Frez Dyno") &&
        error.message.toLowerCase().includes("calibration")
      if (statusElement && !done) {
        statusElement.textContent = canRecoverFrezCalibration
          ? "Factory calibration not found. Enter the actual Frez serial number below and retry."
          : error instanceof Error
            ? error.message
            : "Failed to start stream for tare."
      }
      await showDeviceIdentifiers()
      if (canRecoverFrezCalibration && frezRecoveryElement && !done) {
        frezRecoveryElement.hidden = false
        frezSerialInput?.focus()
      }
    }
  }

  if (frezRetryButton) {
    frezRetryButton.onclick = async () => {
      if (done || typeof device.setDeviceSerialNumber !== "function") return

      const rawSerialNumber = frezSerialInput?.value.trim() ?? ""
      const serialNumber = parseFrezDynoSerialNumber(rawSerialNumber)
      if (!serialNumber) {
        if (statusElement) statusElement.textContent = "Enter a valid Frez serial number before retrying."
        frezSerialInput?.focus()
        return
      }

      frezRetryButton.disabled = true
      if (frezRecoveryElement) frezRecoveryElement.hidden = true
      if (identifiersElement) identifiersElement.hidden = true
      if (statusElement) statusElement.textContent = "Retrying factory calibration lookup..."
      device.setDeviceSerialNumber(serialNumber)
      saveFrezDynoSerialNumber(frezDynoDeviceId, serialNumber)
      await startStreamForTare()
      if (!streamStarted && !done) frezRetryButton.disabled = false
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
