import "./style.css"
import { setupChart, setupMotherboard, setupEntralpi, setupTindeq } from "./devices"

document.querySelector<HTMLDivElement>("#app")!.innerHTML = `
  <div>
    <h1>Grip Connect</h1>
    <h2>Vite + TypeScript example</h2>
    <canvas class="chart"></canvas>
    <div class="card">
      <button id="motherboard" type="button">Connect Motherboard</button>
      <button id="entralpi" type="button">Connect Entralpi</button>
      <button id="tindeq" type="button">Connect Tindeq</button>
    </div>
    <p class="output"></p>
  </div>
`

setupMotherboard(
  document.querySelector<HTMLButtonElement>("#motherboard")!,
  document.querySelector<HTMLDivElement>(".output")!,
)
setupEntralpi(
  document.querySelector<HTMLButtonElement>("#entralpi")!,
  document.querySelector<HTMLDivElement>(".output")!,
)
setupTindeq(document.querySelector<HTMLButtonElement>("#tindeq")!, document.querySelector<HTMLDivElement>(".output")!)
setupChart(document.querySelector<HTMLCanvasElement>(".chart")!)
