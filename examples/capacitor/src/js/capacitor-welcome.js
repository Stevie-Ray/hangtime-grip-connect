import { SplashScreen } from '@capacitor/splash-screen';
import { BleClient } from '@capacitor-community/bluetooth-le';

window.customElements.define(
  'capacitor-welcome',
  class extends HTMLElement {
    constructor() {
      super();

      SplashScreen.hide();

      const root = this.attachShadow({ mode: 'open' });

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
          <button class="button" id="select-device">Select Device</button>
        </p>
        <div id="ble-device"></div>
      </main>
    </div>
    `;
    }

    connectedCallback() {
      const selectButton = this.shadowRoot.querySelector('#select-device');
      const deviceContainer = this.shadowRoot.querySelector('#ble-device');
      let selectedDevice = null;

      selectButton.addEventListener('click', async () => {
        try {
          // Initialize the BLE client
          await BleClient.initialize();

          // Clear previous results
          deviceContainer.innerHTML = '';

          // Request device selection
          selectedDevice = await BleClient.requestDevice({
            services: [], // Empty array means all services
            optionalServices: [], // Optional services to include
            acceptAllDevices: true // Allow any device to be selected
          });

          // Display device information and connection controls
          const deviceElement = document.createElement('div');
          deviceElement.className = 'device-info';
          deviceElement.innerHTML = `
            <strong>${selectedDevice.name || 'Unknown Device'}</strong><br>
            ID: ${selectedDevice.deviceId}<br>
            <span id="connection-status">Connected: ${selectedDevice.connected ? 'Yes' : 'No'}</span>
            <div class="button-group">
              <button class="button" id="connect-device" ${selectedDevice.connected ? 'disabled' : ''}>
                Connect
              </button>
              <button class="button" id="disconnect-device" ${!selectedDevice.connected ? 'disabled' : ''}>
                Disconnect
              </button>
            </div>
          `;
          deviceContainer.appendChild(deviceElement);

          // Add event listeners for connect/disconnect buttons
          const connectButton = deviceElement.querySelector('#connect-device');
          const disconnectButton = deviceElement.querySelector('#disconnect-device');

          connectButton.addEventListener('click', async () => {
            try {
              await BleClient.connect(selectedDevice.deviceId);
              connectButton.disabled = true;
              disconnectButton.disabled = false;
              deviceElement.querySelector('#connection-status').textContent = 'Connected: Yes';
            } catch (error) {
              console.error('Error connecting to device:', error);
              deviceContainer.innerHTML = `<div class="device-info">Error connecting: ${error.message}</div>`;
            }
          });

          disconnectButton.addEventListener('click', async () => {
            try {
              await BleClient.disconnect(selectedDevice.deviceId);
              connectButton.disabled = false;
              disconnectButton.disabled = true;
              deviceElement.querySelector('#connection-status').textContent = 'Connected: No';
            } catch (error) {
              console.error('Error disconnecting from device:', error);
              deviceContainer.innerHTML = `<div class="device-info">Error disconnecting: ${error.message}</div>`;
            }
          });

          selectButton.textContent = 'Select Device';
        } catch (error) {
          console.error('Error selecting device:', error);
          deviceContainer.innerHTML = `<div class="device-info">Error: ${error.message}</div>`;
          selectButton.textContent = 'Select Device';
        }
      });
    }
  },
);

window.customElements.define(
  'capacitor-welcome-titlebar',
  class extends HTMLElement {
    constructor() {
      super();
      const root = this.attachShadow({ mode: 'open' });
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
    `;
    }
  },
);
