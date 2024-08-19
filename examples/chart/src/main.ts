import "./style.css"
import { setupFontAwesome } from "./icons"
import { setupChart, setupDevice } from "./devices"

const appElement = document.querySelector<HTMLDivElement>("#app")
if (appElement) {
  appElement.innerHTML = `
  <div class="card">
    <canvas class="chart"></canvas>
    <div class="input">
      <select id="deviceSelect">
        <option value="">Select device</option>
        <option value="climbro" disabled>Climbro</option>
        <option value="entralpi">Entralpi</option>
        <option value="motherboard">Motherboard</option>
        <option value="whc06">WH-C06</option>
        <option value="smartboard" disabled>mySmartBoard</option>
        <option value="progressor">Progressor</option>
      </select>
      <button id="stream" style="display:none;">
        <div>
          <i class="fa-solid fa-stop"></i>
        </div>
        <div>Stop</div>
      </button>
      <button id="tare" style="display:none;">
        <div>
          <i class="fa-solid fa-scale-balanced"></i>
          <small>5 sec</small>
        </div>
        <div>Tare</div>
      </button>
      <button id="download" style="display:none;">
        <div>
          <i class="fa-solid fa-download"></i>
          <small>CSV</small>
        </div>
        <div>Download</div>
      </button>
    </div>
  </div>
  <div id="masses"></div>
`
}

const deviceSelectElement = document.querySelector<HTMLSelectElement>("#deviceSelect")
const streamButtonElement = document.querySelector<HTMLButtonElement>("#stream")
const tareButtonElement = document.querySelector<HTMLButtonElement>("#tare")
const downloadButtonElement = document.querySelector<HTMLButtonElement>("#download")
const massesElement = document.querySelector<HTMLDivElement>("#masses")

if (deviceSelectElement && streamButtonElement && tareButtonElement && downloadButtonElement && massesElement) {
  setupDevice(deviceSelectElement, streamButtonElement, tareButtonElement, downloadButtonElement, massesElement)
}

const chartElement = document.querySelector<HTMLCanvasElement>(".chart")
if (chartElement) {
  setupChart(chartElement)
}

setupFontAwesome()
