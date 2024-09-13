import "./style.css"
import "./device"

import { setupArduino, setupDevice } from "./device"

const controllerElement = document.querySelector<HTMLDivElement>("#controller")
if (controllerElement) {
  controllerElement.innerHTML += `
    <button id="deviceConnect">Connect Kilter Board</button>
     <small><strong>Tip:</strong> Have an <a href="https://www.arduino.cc/" target="_blank">Arduino</a> with <a href="https://www.arduino.cc/reference/en/libraries/arduinoble/" target="_blank">BLE</a>? Upload <a href="https://github.com/Stevie-Ray/hangtime-arduino-kilterboard/blob/main/fakeAuroraBoard_arduino/fakeAuroraBoard_arduino.ino" target="_blank">this sketch</a> and use the <a href="https://kilterboardapp.com/" target="_blank">Kilter Board App</a>! <a href="#" id="arduinoConnect">Connect via USB</a>.</small>

  `
}

const deviceConnectButton = document.querySelector<HTMLButtonElement>("#deviceConnect")
if (deviceConnectButton) {
  setupDevice(deviceConnectButton)
}

const arduinoConnectButton = document.querySelector<HTMLButtonElement>("#arduinoConnect")
if (arduinoConnectButton) {
  setupArduino(arduinoConnectButton)
}
