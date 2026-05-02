import "./style.css"

import { initializeBoardDemo, processImageToHolds, setupArduino, setupDevice } from "./device.js"
import { setupFontAwesome } from "./icons.js"

const controllerElement = document.querySelector<HTMLDivElement>("#controller")
if (controllerElement) {
  controllerElement.innerHTML += `
    <button id="deviceConnect">Connect Aurora Board</button>
    <small><strong>Tip:</strong> Have an <a href="https://www.arduino.cc/" target="_blank">Arduino</a> with <a href="https://www.arduino.cc/reference/en/libraries/arduinoble/" target="_blank">BLE</a>? Upload <a href="https://github.com/Stevie-Ray/hangtime-arduino-kilterboard/blob/main/fakeAuroraBoard_arduino/fakeAuroraBoard_arduino.ino" target="_blank">this sketch</a> and use the <a href="https://auroraclimbing.com/" target="_blank">Aurora</a> or <a href="http://kilterboard.io/" target="_blank">Kilter</a> App! <a href="#" id="arduinoConnect">Connect via USB</a>.</small>
  `
}

setupFontAwesome()

const deviceConnectButton = document.querySelector<HTMLButtonElement>("#deviceConnect")
if (deviceConnectButton) {
  setupDevice(deviceConnectButton)
}

initializeBoardDemo()

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
