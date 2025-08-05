import "./style.css"
import { setupFontAwesome } from "./icons.js"
import { setupChart, setupDevice } from "./devices.js"

const appElement = document.querySelector<HTMLDivElement>("#app")
if (appElement) {
  appElement.innerHTML = `
  <div class="card">
    <canvas class="chart"></canvas>
  </div>
  <div id="masses"></div>
  <div id="error" style="display:none;"></div>
`
}

const massesElement = document.querySelector<HTMLDivElement>("#masses")
const errorElement = document.querySelector<HTMLDivElement>("#error")

if (massesElement && errorElement) {
  setupDevice(massesElement, errorElement)
}

const chartElement = document.querySelector<HTMLCanvasElement>(".chart")
if (chartElement) {
  setupChart(chartElement)
}

setupFontAwesome()
