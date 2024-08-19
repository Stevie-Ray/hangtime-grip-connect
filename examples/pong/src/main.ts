import "./style.css"
import "./game"

import { setupDevice, setupWeight, setupDifficulty } from "./game"

const controllerElement = document.querySelector<HTMLDivElement>("#controller")
if (controllerElement) {
  controllerElement.innerHTML += `
    <select id="deviceSelect">
      <option value="">Select device</option>
      <option value="climbro" disabled>Climbro</option>
      <option value="entralpi">Entralpi</option>
      <option value="motherboard">Motherboard</option>
      <option value="whc06">WH-C06</option>
      <option value="smartboard" disabled>mySmartBoard</option>
      <option value="progressor">Progressor</option>
    </select>
    <input id="weightInput" placeholder="weight" value="75" type="number">
    <select id="difficultySelect">
      <option>Select difficulty</option>
      <option value="easy">Easy</option>
      <option value="normal" selected>Normal</option>
      <option value="hard">Hard</option>
    </select>
  `
}

const deviceSelectElement = document.querySelector<HTMLSelectElement>("#deviceSelect")
const weightInputElement = document.querySelector<HTMLInputElement>("#weightInput")
const difficultySelectElement = document.querySelector<HTMLSelectElement>("#difficultySelect")

if (deviceSelectElement) {
  setupDevice(deviceSelectElement)
}

if (weightInputElement) {
  setupWeight(weightInputElement)
}

if (difficultySelectElement) {
  setupDifficulty(difficultySelectElement)
}
