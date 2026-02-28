import { menuActions } from "./menu.js"
import { getTestModule } from "./tests/registry.js"
import { loadConfig } from "./tests/storage.js"

export function setupNewSessionPage(actionId: string): string {
  const action = menuActions.find((item) => item.id === actionId)
  if (!action || action.disabled) return ""
  const module = getTestModule(actionId)
  const details = action.description || action.short_description
  const options = module ? module.renderOptions(loadConfig(module.id, module.defaultConfig)) : ""

  return `
    <section class="session-page" aria-label="${action.name} options">
      <div class="page-title-row">
        <a class="session-back-link" href="?route=${action.id}"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>${action.name}</h3>
      </div>

      <div class="section-content">
        <p>${details}</p>
        <form id="session-options-form">
          ${options}
        </form>
      </div>

      <button type="button" class="start-session-button" data-start-session-action="${action.id}">Start Session</button>
  
    </section>
  `
}
