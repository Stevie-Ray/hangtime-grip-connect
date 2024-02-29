import "./style.css"
import { setupChart, setupDevice } from "./devices"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>
      <a href="https://github.com/Stevie-Ray/hangtime-grip-connect" target="_blank" rel="noreferrer">
      Grip Connect
      </a>
    </h1>
    <h2>Web Bluetooth API Force-Sensing strength analysis for climbers</h2>
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
      <button id="tare">Tare (5sec)</button>
      <button id="stop">Stop</button>
      <button id="download">Download</button>
    </div>
  </div>
`

setupDevice(
  document.querySelector<HTMLSelectElement>("#deviceSelect")!,
  document.querySelector<HTMLButtonElement>("#tare")!,
  document.querySelector<HTMLButtonElement>("#download")!,
  document.querySelector<HTMLButtonElement>("#stop")!,
)

setupChart(document.querySelector<HTMLCanvasElement>(".chart")!)
