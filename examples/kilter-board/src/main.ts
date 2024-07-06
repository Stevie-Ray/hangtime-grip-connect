import "./style.css"
import "./device"

import { setupDevice } from "./device"

document.querySelector<HTMLDivElement>("#controller")!.innerHTML += `
 <button id="deviceConnect">Connect Kilterboard</button>
`
setupDevice(document.querySelector<HTMLButtonElement>("#deviceConnect")!)