import { listMeasurementTags } from "../protocols/storage.js"
import type { TestId } from "../protocols/types.js"

export interface SaveMeasurementInput {
  tag?: string
  comment?: string
}

function supportsDialog(): boolean {
  return typeof HTMLDialogElement !== "undefined" && typeof document.createElement("dialog").showModal === "function"
}

function normalizeOptionalText(value: string | null): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : undefined
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

async function showDialog(testId: TestId): Promise<SaveMeasurementInput | null> {
  const knownTags = listMeasurementTags(testId)
  const listId = `measurement-tags-${Date.now()}`
  const options = knownTags.map((tag) => `<option value="${escapeHtml(tag)}"></option>`).join("")

  const dialog = document.createElement("dialog")
  dialog.className = "save-measurement-dialog"
  dialog.innerHTML = `
    <form method="dialog" class="save-measurement-form">
      <h3>Save Session</h3>
      <label class="save-measurement-field">
        <span>Type in a tag</span>
        <input name="tag" type="text" list="${listId}" placeholder="e.g. max-effort" />
        <datalist id="${listId}">${options}</datalist>
      </label>
      <label class="save-measurement-field">
        <span>Type in a comment</span>
        <textarea name="comment" rows="4" placeholder="Optional comment"></textarea>
      </label>
      <menu class="save-measurement-actions">
        <button type="button" value="cancel" data-save-cancel>Cancel</button>
        <button type="submit" value="confirm">Save Session</button>
      </menu>
    </form>
  `

  document.body.appendChild(dialog)
  const cancelButton = dialog.querySelector<HTMLButtonElement>("[data-save-cancel]")
  if (cancelButton) {
    cancelButton.onclick = () => {
      dialog.close("cancel")
    }
  }

  dialog.addEventListener("cancel", (event) => {
    event.preventDefault()
    dialog.close("cancel")
  })

  dialog.showModal()
  const result = await new Promise<SaveMeasurementInput | null>((resolve) => {
    dialog.addEventListener(
      "close",
      () => {
        if (dialog.returnValue !== "confirm") {
          resolve(null)
          return
        }
        const formElement = dialog.querySelector<HTMLFormElement>("form")
        if (!formElement) {
          resolve(null)
          return
        }
        const formData = new FormData(formElement)
        const tag = normalizeOptionalText(formData.get("tag") as string | null)
        const comment = normalizeOptionalText(formData.get("comment") as string | null)
        resolve({
          ...(tag ? { tag } : {}),
          ...(comment ? { comment } : {}),
        })
      },
      { once: true },
    )
  })

  dialog.remove()
  return result
}

function showFallbackPrompts(testId: TestId): SaveMeasurementInput | null {
  const existingTags = listMeasurementTags(testId)
  const hint = existingTags.length > 0 ? `\nExisting tags: ${existingTags.join(", ")}` : ""
  const tag = window.prompt(`Type in a tag (optional).${hint}`)
  if (tag === null) return null
  const comment = window.prompt("Type in a comment (optional).")
  if (comment === null) return null
  const normalizedTag = normalizeOptionalText(tag)
  const normalizedComment = normalizeOptionalText(comment)
  return {
    ...(normalizedTag ? { tag: normalizedTag } : {}),
    ...(normalizedComment ? { comment: normalizedComment } : {}),
  }
}

export async function promptSaveMeasurementInput(testId: TestId): Promise<SaveMeasurementInput | null> {
  if (!supportsDialog()) {
    return showFallbackPrompts(testId)
  }
  return showDialog(testId)
}
