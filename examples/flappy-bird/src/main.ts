import "./style.css"
import "./game"

import { setupDevice, setupWeight, setupDifficulty } from "./game"

document.querySelector<HTMLDivElement>("#controller")!.innerHTML += `
 <select id="deviceSelect">
        <option>Select device</option>
        <option value="climbro" disabled>Climbro</option>
        <option value="entralpi">Entralpi</option>
        <option value="motherboard">Motherboard</option>
        <option value="smartboard" disabled>SmartBoard</option>
        <option value="progressor" selected>Progressor</option>
      </select>
      <input id="weightInput" placeholder="weight" value="75" type="number">
       <select id="difficultySelect">
        <option>Select difficulty</option>
        <option value="easy">Easy</option>
        <option value="normal" selected>Normal</option>
        <option value="hard">Hard</option>
      </select>
`

setupDevice(document.querySelector<HTMLSelectElement>("#deviceSelect")!)

setupWeight(document.querySelector<HTMLInputElement>("#weightInput")!)

setupDifficulty(document.querySelector<HTMLSelectElement>("#difficultySelect")!)
