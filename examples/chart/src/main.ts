import "./style.css"
import { setupFontAwesome } from "./icons"
import { setupChart, setupDevice } from "./devices"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div class="card">
    <canvas class="chart"></canvas>
    <div class="input">
      <select id="deviceSelect">
        <option value="">Select device</option>
        <option value="climbro" disabled>Climbro</option>
        <option value="entralpi">Entralpi</option>
        <option value="motherboard">Motherboard</option>
        <option value="musclemeter" disabled>Muscle Meter</option>
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

setupDevice(
  document.querySelector<HTMLSelectElement>("#deviceSelect")!,
  document.querySelector<HTMLButtonElement>("#stream")!,
  document.querySelector<HTMLButtonElement>("#tare")!,
  document.querySelector<HTMLButtonElement>("#download")!,
  document.querySelector<HTMLDivElement>("#masses")!,
)

setupChart(document.querySelector<HTMLCanvasElement>(".chart")!)

setupFontAwesome()
