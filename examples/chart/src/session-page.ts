import { menuActions } from "./menu.js"
import { getTestModule } from "./tests/registry.js"
import { listMeasurements } from "./tests/storage.js"

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
            return `<li class="card">
              <span class="card-content measurement-list-item" aria-label="${date}">
                <strong>${date}</strong>
                <small>${item.headline}</small>
                <small>${item.details.join(" | ")}</small>
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
