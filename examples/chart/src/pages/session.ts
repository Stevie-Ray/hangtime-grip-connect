import { menuActions } from "../ui/menu.js"
import { getTestModule } from "../protocols/registry.js"
import { listMeasurements } from "../protocols/storage.js"

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;")
}

export function setupSessionPage(actionId: string): string {
  const action = menuActions.find((item) => item.id === actionId)
  if (!action || action.disabled) return ""
  const module = getTestModule(actionId)
  const measurements = module ? listMeasurements(module.id) : []
  const measurementState =
    measurements.length > 0
      ? `<ul class="action-menu-list measurement-list">${measurements
          .map((item) => {
            const date = new Date(item.createdAt).toLocaleString()
            const tagMarkup = item.tag ? `<small><strong>Tag:</strong> ${escapeHtml(item.tag)}</small>` : ""
            const commentMarkup = item.comment
              ? `<small><strong>Comment:</strong> ${escapeHtml(item.comment)}</small>`
              : ""
            const detailsSummary = item.details.map((detail) => escapeHtml(detail)).join(" | ")
            return `<li class="card">
              <span class="card-content measurement-list-item" aria-label="${date}">
                <strong>${date}</strong>
                <small>${escapeHtml(item.headline)}</small>
                ${tagMarkup}
                ${commentMarkup}
                <small>${detailsSummary}</small>
              </span>
            </li>`
          })
          .join("")}</ul>`
      : '<p class="measurement-empty">No measurements yet.</p>'

  return `
    <section class="session-page" aria-label="${action.name}">
      <div class="page-title-row">
        <a class="session-back-link" href="?"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>${action.name}</h3>
      </div>
      
      <div class="section-content">
        ${measurementState}
      </div>

      <button type="button" class="new-session-button" data-new-session-action="${action.id}">New Session</button>
    </section>
  `
}
