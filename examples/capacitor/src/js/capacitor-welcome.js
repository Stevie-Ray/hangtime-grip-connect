import { SplashScreen } from "@capacitor/splash-screen"
import {
  Climbro,
  Entralpi,
  ForceBoard,
  KilterBoard,
  Motherboard,
  mySmartBoard,
  Progressor,
  SmartBoardPro,
  WHC06,
} from "@hangtime/grip-connect-capacitor"

window.customElements.define(
  "capacitor-welcome",
  class extends HTMLElement {
    constructor() {
      super()

      SplashScreen.hide()

      const root = this.attachShadow({ mode: "open" })

      root.innerHTML = `
    <style>
      :host {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        display: block;
        width: 100%;
        height: 100%;
      }
      h1, h2, h3, h4, h5 {
        text-transform: uppercase;
      }
      .button {
        display: inline-block;
        padding: 10px;
        background-color: #73B5F6;
        color: #fff;
        font-size: 0.9em;
        border: 0;
        border-radius: 3px;
        text-decoration: none;
        cursor: pointer;
      }
      .button:disabled {
        background-color: #ccc;
        cursor: not-allowed;
      }
      main {
        padding: 15px;
      }
      main hr { height: 1px; background-color: #eee; border: 0; }
      main h1 {
        font-size: 1.4em;
        text-transform: uppercase;
        letter-spacing: 1px;
      }
      main h2 {
        font-size: 1.1em;
      }
      main h3 {
        font-size: 0.9em;
      }
      main p {
        color: #333;
      }
      main pre {
        white-space: pre-line;
      }
      #ble-device {
        margin-top: 15px;
        padding: 10px;
        border: 1px solid #eee;
      }
      .device-info {
        padding: 8px;
      }
      .button-group {
        margin-top: 10px;
        display: flex;
        gap: 10px;
      }
      select {
        appearance: none;
        border-radius: 8px;
        border: 1px solid #ccc;
        padding: 0.6em;
        font-size: 1em;
        font-weight: 500;
        font-family: inherit;
        background-color: #fff;
        cursor: pointer;
        text-align: center;
        transition: border-color 0.25s;
        width: 100%;
        max-width: 300px;
      }
      select:hover {
        border-color: #73B5F6;
      }
      select:focus {
        outline: none;
        border-color: #73B5F6;
      }
    </style>
    <div>
      <capacitor-welcome-titlebar>
        <h1>Capacitor</h1>
      </capacitor-welcome-titlebar>
      <main>
        <p>
          Capacitor makes it easy to build powerful apps for the app stores, mobile web (Progressive Web Apps), and desktop, all
          with a single code base.
        </p>
        <h2>Getting Started</h2>
        <p>
          You'll probably need a UI framework to build a full-featured app. Might we recommend
          <a target="_blank" href="http://ionicframework.com/">Ionic</a>?
        </p>
        <p>
          Visit <a href="https://capacitorjs.com">capacitorjs.com</a> for information
          on using native features, building plugins, and more.
        </p>
        <a href="https://capacitorjs.com" target="_blank" class="button">Read more</a>
        <h2>Bluetooth LE Demo</h2>
        <p>
          This demo shows how to connect to a Bluetooth LE device.
        </p>
        <p>
          <select id="device-select">
            <option value="">Select device</option>
            <option value="climbro" disabled>Climbro</option>
            <option value="entralpi">Entralpi</option>
            <option value="forceboard">Force Board</option>
            <option value="kilterboard">Kilter Board</option>
            <option value="motherboard">Motherboard</option>
            <option value="smartboard" disabled>mySmartBoard</option>
            <option value="progressor">Progressor</option>
            <option value="smartboardpro">Smart Board Pro</option>
            <option value="whc06">WH-C06</option>
          </select>
        </p>
        <div id="ble-device"></div>
      </main>
    </div>
    `
    }

    connectedCallback() {
      const deviceSelect = this.shadowRoot.querySelector("#device-select")
      const deviceContainer = this.shadowRoot.querySelector("#ble-device")

      deviceSelect.addEventListener("change", async () => {
        try {
          // // Initialize the BLE client
          // await BleClient.initialize();

          // Clear previous results
          deviceContainer.innerHTML = ""

          const selectedDeviceType = deviceSelect.value
          let device

          // Create the appropriate device instance based on selection
          switch (selectedDeviceType) {
            case "climbro":
              device = new Climbro()
              break
            case "entralpi":
              device = new Entralpi()
              break
            case "forceboard":
              device = new ForceBoard()
              break
            case "kilterboard":
              device = new KilterBoard()
              break
            case "motherboard":
              device = new Motherboard()
              break
            case "smartboard":
              device = new mySmartBoard()
              break
            case "progressor":
              device = new Progressor()
              break
            case "smartboardpro":
              device = new SmartBoardPro()
              break
            case "whc06":
              device = new WHC06()
              break
            default:
              return
          }

          // Display device information and connection controls
          const deviceElement = document.createElement("div")
          deviceElement.className = "device-info"
          deviceElement.innerHTML = `
            <strong>${device.constructor.name}</strong><br>
            <div class="button-group">
              <button class="button" id="connect-device">
                Connect
              </button>
              <button class="button" id="disconnect-device" disabled>
                Disconnect
              </button>
            </div>
          `
          deviceContainer.appendChild(deviceElement)

          // Add event listeners for connect/disconnect buttons
          const connectButton = deviceElement.querySelector("#connect-device")
          const disconnectButton = deviceElement.querySelector("#disconnect-device")

          connectButton.addEventListener("click", async () => {
            try {
              await device.connect(
                async () => {
                  device.notify((data) => {
                    console.log(data)
                  })

                  const batteryLevel = await device.battery()
                  if (batteryLevel) {
                    console.log("Battery Level:", batteryLevel)
                  }

                  const firmwareRevision = await device.firmware()
                  if (firmwareRevision) {
                    console.log("Firmware Revision:", firmwareRevision)
                  }

                  await device.stream()
                },
                (error) => {
                  console.log(error)
                },
              )
              connectButton.disabled = true
              disconnectButton.disabled = false
            } catch (error) {
              console.error("Error connecting to device:", error)
              deviceContainer.innerHTML = `<div class="device-info">Error connecting: ${error.message}</div>`
            }
          })

          disconnectButton.addEventListener("click", async () => {
            try {
              await device.disconnect()
              connectButton.disabled = false
              disconnectButton.disabled = true
            } catch (error) {
              console.error("Error disconnecting from device:", error)
              deviceContainer.innerHTML = `<div class="device-info">Error disconnecting: ${error.message}</div>`
            }
          })
        } catch (error) {
          console.error("Error selecting device:", error)
          deviceContainer.innerHTML = `<div class="device-info">Error: ${error.message}</div>`
        }
      })
    }
  },
)

window.customElements.define(
  "capacitor-welcome-titlebar",
  class extends HTMLElement {
    constructor() {
      super()
      const root = this.attachShadow({ mode: "open" })
      root.innerHTML = `
    <style>
      :host {
        position: relative;
        display: block;
        padding: 15px 15px 15px 15px;
        text-align: center;
        background-color: #73B5F6;
      }
      ::slotted(h1) {
        margin: 0;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol";
        font-size: 0.9em;
        font-weight: 600;
        color: #fff;
      }
    </style>
    <slot></slot>
    `
    }
  },
)
