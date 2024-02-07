import "./style.css"
import "./game"

import { setupDevice } from "./game"

document.querySelector<HTMLDivElement>("#controller")!.innerHTML += `
 <select id="deviceSelect">
        <option>Select device</option>
        <option value="climbro" disabled>Climbro</option>
        <option value="entralpi">Entralpi</option>
        <option value="motherboard" selected>Motherboard</option>
        <option value="smartboard" disabled>SmartBoard</option>
        <option value="tindeq">Tindeq</option>
      </select>
`

setupDevice(document.querySelector<HTMLSelectElement>("#deviceSelect")!)
