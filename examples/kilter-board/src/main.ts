import "./style.css"
import "./device"

import { setupDevice } from "./device"

const controllerElement = document.querySelector<HTMLDivElement>("#controller")
if (controllerElement) {
  controllerElement.innerHTML += `
    <button id="deviceConnect">Connect Kilterboard</button>
  `
}

const deviceConnectButton = document.querySelector<HTMLButtonElement>("#deviceConnect")
if (deviceConnectButton) {
  setupDevice(deviceConnectButton)
}
