import { hasTrainingProgramsEnv } from "../training-programs/api.js"
import { escapeHtml } from "../lib/html.js"
import type { TrainingProgramEntry, TrainingProgramRecord } from "../training-programs/model.js"
import { createTrainingProgramEntries, findTrainingProgramEntry } from "../training-programs/model.js"

interface TrainingProgramsPageState {
  programs: TrainingProgramRecord[] | null
  loading: boolean
  error: string | null
  selectedProgramId: string | null
  loadPresetNotice: string | null
}

function summarizeText(input: string | undefined, fallback: string): string {
  if (!input) return fallback
  const normalized = input.replace(/\s+/g, " ").trim()
  return normalized.length > 0 ? normalized : fallback
}

function toDateLabel(program: TrainingProgramRecord): string {
  const value = typeof program.date === "number" ? program.date : undefined
  if (!value) return "Unknown"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "Unknown"
  return date.toLocaleString()
}

function toTagsLabel(program: TrainingProgramRecord): string {
  if (!Array.isArray(program.tags)) return "None"
  const tags = program.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
  return tags.length > 0 ? tags.join(", ") : "None"
}

export function setupTrainingProgramsPage(state: TrainingProgramsPageState): string {
  const hasEnv = hasTrainingProgramsEnv()
  const entries = createTrainingProgramEntries(state.programs ?? [])
  const listHeader = `
    <div class="page-title-row">
      <a class="session-back-link" href="?"><i class="fa-solid fa-arrow-left"></i></a>
      <h3>Training Programs</h3>
    </div>
  `
  const detailHeader = `
    <div class="page-title-row">
      <a class="session-back-link" href="?screen=training-programs"><i class="fa-solid fa-arrow-left"></i></a>
      <h3>Training Programs</h3>
    </div>
  `

  if (!hasEnv) {
    return `
      <section class="session-page" aria-label="Training Programs">
        ${listHeader}
        <div class="section-content">
          <p>Missing credentials. Add the environment variables to your .env file.</p>
        </div>
      </section>
    `
  }

  if (state.loading) {
    return `
      <section class="session-page" aria-label="Training Programs">
        ${state.selectedProgramId ? detailHeader : listHeader}
        <div class="section-content">
          <p>Loading training programs...</p>
        </div>
      </section>
    `
  }

  if (state.error) {
    return `
      <section class="session-page" aria-label="Training Programs">
        ${state.selectedProgramId ? detailHeader : listHeader}
        <div class="section-content">
          <p class="training-programs-error">${escapeHtml(state.error)}</p>
          <button type="button" data-refresh-training-programs>Retry</button>
        </div>
      </section>
    `
  }

  if (state.selectedProgramId) {
    const selectedEntry = findTrainingProgramEntry(state.programs, state.selectedProgramId)

    if (!selectedEntry) {
      return `
        <section class="session-page" aria-label="Training Programs">
          ${detailHeader}
          <div class="section-content">
            <p>Training program not found.</p>
          </div>
        </section>
      `
    }

    const selected = selectedEntry.program
    const title = summarizeText(selected.name ?? selected.title, "Untitled")
    const description = summarizeText(selected.description, "No description.")
    const likes = typeof selected.likes === "number" ? selected.likes : 0
    const dateLabel = toDateLabel(selected)
    const tagsLabel = toTagsLabel(selected)
    const hasRepeatersPreset = selected["repeatersPreset"] !== undefined

    return `
      <section class="session-page" aria-label="Training Program details">
        ${detailHeader}
        <div class="section-content">
          <ul class="action-menu-list">
            <li class="card">
              <span class="card-content" aria-label="${escapeHtml(title)}">
                <strong>${escapeHtml(title)}</strong>
                <small>${escapeHtml(description)}</small>
                <small>Date: ${escapeHtml(dateLabel)}</small>
                <small>Likes: ${escapeHtml(likes)}</small>
                <small>Tags: ${escapeHtml(tagsLabel)}</small>
              </span>
            </li>
          </ul>
          ${
            state.loadPresetNotice ? `<p class="training-programs-error">${escapeHtml(state.loadPresetNotice)}</p>` : ""
          }
        </div>
        <button type="button" data-load-training-program="${escapeHtml(selectedEntry.id)}" ${
          hasRepeatersPreset ? "" : "disabled"
        }>Load Preset</button>
      </section>
    `
  }

  const listMarkup =
    entries.length === 0
      ? "<p>No training programs found.</p>"
      : `<ul class="action-menu-list training-programs-list">${entries
          .map(({ id, program }: TrainingProgramEntry) => {
            const title = summarizeText(program.name ?? program.title, "Untitled")
            const description = summarizeText(program.description, "No description.")
            const likes = typeof program.likes === "number" ? program.likes : 0
            const dateLabel = toDateLabel(program)
            const tagsLabel = toTagsLabel(program)

            return `
              <li class="card">
                <a class="card-content" href="?screen=training-programs&trainingProgram=${encodeURIComponent(id)}" aria-label="${escapeHtml(title)}">
                  <strong>${escapeHtml(title)}</strong>
                  <small>${escapeHtml(description)}</small>
                  <small>Date: ${escapeHtml(dateLabel)} | Likes: ${escapeHtml(likes)} | Tags: ${escapeHtml(tagsLabel)}</small>
                </a>
              </li>
            `
          })
          .join("")}</ul>`

  return `
    <section class="session-page" aria-label="Training Programs">
      ${listHeader}
      <div class="section-content">
        <div class="training-programs-toolbar">
          <button type="button" data-refresh-training-programs>Refresh</button>
        </div>
        ${listMarkup}
      </div>
    </section>
  `
}
