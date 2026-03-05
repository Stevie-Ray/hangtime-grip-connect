import { menuActions } from "../ui/menu.js"

export function setupSessionChartPage(actionId: string): string {
  const action = menuActions.find((item) => item.id === actionId)
  if (!action || action.disabled) return ""
  const backHref = action.id === "live-data" ? "?" : `?route=${action.id}&screen=new-session`
  const sessionResultMarkup = action.id === "rfd" ? '<div id="session-result"></div>' : ""

  return `
    <section class="session-page" aria-label="${action.name} chart">
      <div class="page-title-row">
        <a class="session-back-link" href="${backHref}"><i class="fa-solid fa-arrow-left"></i></a>
        <h3>${action.name}</h3>
      </div>

      <div class="section-content">
        <h4 id="session-status">Preparing session...</h4>
        <div class="session-controls">
          <button type="button" data-stop-session hidden disabled>Stop Session</button>
          <button type="button" data-reset-session hidden disabled>Reset Session</button>
        </div>
        <div id="masses" aria-live="polite"></div>
        <canvas id="session-chart" class="chart"></canvas>
        ${sessionResultMarkup}
      </div>
    </section>
  `
}
