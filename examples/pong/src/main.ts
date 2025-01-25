import "./style.css"
import "./game"

import { setupDevice, setupDifficulty, setupTare, setupWeight } from "./game"

const controllerElement = document.querySelector<HTMLDivElement>("#controller")
if (controllerElement) {
  controllerElement.innerHTML += `
    <div id="control">
      <div>
        <label for="deviceSelect">&nbsp;</label>
        <select id="deviceSelect">
          <option value="">Select device</option>
          <option value="climbro" disabled>Climbro</option>
          <option value="entralpi">Entralpi</option>
          <option value="forceboard">Force Board</option>
          <option value="motherboard">Motherboard</option>
          <option value="smartboard" disabled>mySmartBoard</option>
          <option value="progressor">Progressor</option>
          <option value="whc06">WH-C06</option>
        </select>
      </div>
      <div>
       <label for="deviceSelect">&nbsp;</label>
       <button id="tare">Tare</button>
      </div>
      <div id="weight-control">
        <label for="weightInput">Target weight</label>
        <input id="weightInput" placeholder="weight" value="5" type="number">
      </div>
      <div>
        <label for="difficultySelect" title="Pipe gap size">Difficulty</label>
        <select id="difficultySelect">
          <option>Select difficulty</option>
          <option value="easy">Easy</option>
          <option value="normal" selected>Normal</option>
          <option value="hard">Hard</option>
        </select>
      </div>
    </div>
    <div id="error" style="display:none;"></div> 
  `
}

const deviceSelectElement = document.querySelector<HTMLSelectElement>("#deviceSelect")
const weightInputElement = document.querySelector<HTMLInputElement>("#weightInput")
const difficultySelectElement = document.querySelector<HTMLSelectElement>("#difficultySelect")
const tareElement = document.querySelector<HTMLDivElement>("#tare")
const errorElement = document.querySelector<HTMLDivElement>("#error")

if (deviceSelectElement && errorElement) {
  setupDevice(deviceSelectElement, errorElement)
}

if (weightInputElement) {
  setupWeight(weightInputElement)
}

if (tareElement) {
  setupTare(tareElement)
}

if (difficultySelectElement) {
  setupDifficulty(difficultySelectElement)
}
