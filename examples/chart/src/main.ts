import "./style.css"
import { setupFontAwesome } from "./icons"
import { setupChart, setupDevice } from "./devices"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <canvas class="chart"></canvas>
    <div class="card">
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
        <i class="fa-solid fa-stop"></i>
        <span> Stop</span>
      </button>
      <button id="tare" style="display:none;">
        <i class="fa-solid fa-scale-balanced"></i>
        <span> Tare (5sec)</span>
      </button>
      <button id="download" style="display:none;">
        <i class="fa-solid fa-download"></i>
        <span> Download</span>
      </button>
    </div>
  </div>
`

setupDevice(
  document.querySelector<HTMLSelectElement>("#deviceSelect")!,
  document.querySelector<HTMLButtonElement>("#stream")!,
  document.querySelector<HTMLButtonElement>("#tare")!,
  document.querySelector<HTMLButtonElement>("#download")!,
)

setupChart(document.querySelector<HTMLCanvasElement>(".chart")!)

setupFontAwesome()
