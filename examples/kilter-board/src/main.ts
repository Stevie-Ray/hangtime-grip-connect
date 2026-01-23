import "./style.css"

import { setupArduino, setupDevice, processImageToHolds } from "./device.js"
import { setupFontAwesome } from "./icons.js"

const controllerElement = document.querySelector<HTMLDivElement>("#controller")
if (controllerElement) {
  controllerElement.innerHTML += `
    <button id="deviceConnect">Connect Kilter Board</button>
     <small><strong>Tip:</strong> Have an <a href="https://www.arduino.cc/" target="_blank">Arduino</a> with <a href="https://www.arduino.cc/reference/en/libraries/arduinoble/" target="_blank">BLE</a>? Upload <a href="https://github.com/Stevie-Ray/hangtime-arduino-kilterboard/blob/main/fakeAuroraBoard_arduino/fakeAuroraBoard_arduino.ino" target="_blank">this sketch</a> and use the <a href="https://kilterboardapp.com/" target="_blank">Kilter Board App</a>! <a href="#" id="arduinoConnect">Connect via USB</a>.</small>

  `
}

setupFontAwesome()

const deviceConnectButton = document.querySelector<HTMLButtonElement>("#deviceConnect")
if (deviceConnectButton) {
  setupDevice(deviceConnectButton)
}

const arduinoConnectButton = document.querySelector<HTMLButtonElement>("#arduinoConnect")
if (arduinoConnectButton) {
  setupArduino(arduinoConnectButton)
}

const imageInput = document.querySelector<HTMLInputElement>("#image-input")

if (imageInput) {
  imageInput.addEventListener("change", async (event) => {
    const file = (event.target as HTMLInputElement).files?.[0]
    if (!file) {
      return
    }

    try {
      await processImageToHolds(file)
    } catch (error) {
      console.error("Error processing image:", error)
    }
  })
}
