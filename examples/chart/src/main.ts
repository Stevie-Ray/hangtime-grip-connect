import "./style.css"
import { connectSelectedDevice } from "./device-connect.js"
import { setupFooter } from "./footer.js"
import { convertFontAwesome, setupFontAwesome } from "./icons.js"
import { setupMenuHeader } from "./menu-header.js"
import { setupMenu } from "./menu.js"
import { setupNewSessionPage } from "./new-session-page.js"
import { renderSessionChart, setupSessionChartPage, teardownSessionChart } from "./session-chart-page.js"
import { setupSessionPage } from "./session-page.js"
import { setupSettingsPage } from "./settings-page.js"
import { getTestModule } from "./tests/registry.js"
import { loadConfig, saveConfig } from "./tests/storage.js"

const appElement = document.querySelector<HTMLDivElement>("#app")
let isDeviceConnected = false

setupFontAwesome()

function getRouteActionId(): string | null {
  const route = new URLSearchParams(window.location.search).get("route")
  return route && /^[a-z0-9-]+$/.test(route) ? route : null
}

function getScreen(): string | null {
  return new URLSearchParams(window.location.search).get("screen")
}

function navigate(search: string): void {
  history.pushState({}, "", search)
  void render()
}

async function render(): Promise<void> {
  if (!appElement) return

  const actionId = getRouteActionId()
  const screen = getScreen()
  if (screen !== "chart") {
    await teardownSessionChart()
  }
  const content =
    screen === "settings"
      ? setupSettingsPage()
      : actionId
        ? screen === "chart"
          ? setupSessionChartPage(actionId)
          : screen === "new-session"
            ? setupNewSessionPage(actionId)
            : setupSessionPage(actionId)
        : setupMenu()

  appElement.innerHTML = `
    <div class="card">
      ${setupMenuHeader()}
      ${content}
    </div>
    ${setupFooter()}
  `
  const toggleDeviceListButton = appElement.querySelector<HTMLButtonElement>("[data-toggle-device-list]")
  if (toggleDeviceListButton) {
    toggleDeviceListButton.classList.toggle("is-connected", isDeviceConnected)
  }
  convertFontAwesome()
  if (actionId && screen === "chart") {
    renderSessionChart(actionId)
  }
}

appElement?.addEventListener("click", (event) => {
  const target = event.target as HTMLElement | null

  const internalLink = target?.closest<HTMLAnchorElement>('a[href^="?"]')
  if (internalLink) {
    event.preventDefault()
    const href = internalLink.getAttribute("href")
    if (href) navigate(href)
    return
  }

  const toggleDeviceListButton = target?.closest<HTMLButtonElement>("[data-toggle-device-list]")
  if (toggleDeviceListButton) {
    const deviceList = appElement.querySelector<HTMLElement>("#device-list")
    if (!deviceList) return
    const willOpen = deviceList.hasAttribute("hidden")
    if (willOpen) {
      deviceList.removeAttribute("hidden")
    } else {
      deviceList.setAttribute("hidden", "")
    }
    toggleDeviceListButton.setAttribute("aria-expanded", String(willOpen))
    return
  }

  const deviceButton = target?.closest<HTMLButtonElement>("[data-device-key]")
  if (deviceButton) {
    const deviceKey = deviceButton.dataset["deviceKey"]
    const deviceName = deviceButton.dataset["deviceName"]
    if (!deviceKey || !deviceName) return
    const statusElement = appElement.querySelector<HTMLElement>("#device-connect-status")
    void connectSelectedDevice(deviceKey, deviceName, statusElement).then((connected) => {
      if (!connected) return
      isDeviceConnected = true
      const deviceList = appElement.querySelector<HTMLElement>("#device-list")
      if (deviceList) deviceList.setAttribute("hidden", "")
      const btButton = appElement.querySelector<HTMLButtonElement>("[data-toggle-device-list]")
      if (btButton) {
        btButton.classList.add("is-connected")
        btButton.setAttribute("aria-expanded", "false")
      }
    })
    return
  }

  const openSettingsButton = target?.closest<HTMLButtonElement>("[data-open-settings]")
  if (openSettingsButton) {
    navigate("?screen=settings")
    return
  }

  const newSessionButton = target?.closest<HTMLButtonElement>("[data-new-session-action]")
  if (newSessionButton) {
    const actionId = newSessionButton.dataset["newSessionAction"]
    if (!actionId) return
    navigate(`?route=${encodeURIComponent(actionId)}&screen=new-session`)
    return
  }

  const startSessionButton = target?.closest<HTMLButtonElement>("[data-start-session-action]")
  if (!startSessionButton) return
  const actionId = startSessionButton.dataset["startSessionAction"]
  if (!actionId) return
  const module = getTestModule(actionId)
  if (module) {
    const form = appElement.querySelector<HTMLElement>("#session-options-form")
    const currentConfig = loadConfig(module.id, module.defaultConfig)
    const nextConfig = module.parseOptions(form ?? appElement, currentConfig)
    saveConfig(module.id, nextConfig)
  }
  navigate(`?route=${encodeURIComponent(actionId)}&screen=chart`)
})

window.addEventListener("popstate", () => {
  void render()
})

void render()
