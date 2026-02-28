import { setupDeviceList } from "./device-list.js"

export function setupMenuHeader(isDeviceConnected = false) {
  return `
  <header>
    <div class="header-row">
      <div class="header-brand">
        <h1>
          <svg xmlns="http://www.w3.org/2000/svg" width="28" height="33">
            <g fill="currentColor" fill-rule="nonzero">
              <path
                d="M9.457 3.318h8.934V.28H9.457v3.04Zm0 1.474a4.483 4.483 0 0 0 2.553 4.043v10.138h1.276v-4.479h1.276v4.479h1.276V8.828a4.467 4.467 0 0 0 2.553-4.036h-1.277a3.194 3.194 0 0 1-3.19 3.198 3.194 3.194 0 0 1-3.19-3.198m3.19 0a1.273 1.273 0 0 0-1.276 1.279 1.273 1.273 0 0 0 1.276 1.28A1.274 1.274 0 0 0 15.2 6.07a1.273 1.273 0 0 0-1.276-1.28Z"
              />
              <path
                d="M24.38 10.06 26.5 7.9a16.68 16.68 0 0 0-2.106-2.143l-2.121 2.16A13.505 13.505 0 0 0 19.75 6.3a4.638 4.638 0 0 1-1.444 2.654c3.56 1.696 6.028 5.366 6.028 9.637 0 5.885-4.676 10.645-10.457 10.645-5.781 0-10.457-4.76-10.457-10.645 0-4.311 2.514-8.01 6.128-9.683a4.645 4.645 0 0 1-1.567-2.592A13.683 13.683 0 0 0 .433 18.593c0 7.557 6.005 13.686 13.445 13.686s13.445-6.129 13.445-13.686c0-3.224-1.106-6.19-2.943-8.532Z"
              />
            </g>
          </svg>
          <span>Grip Connect</span>
        </h1>
        <small>Web Bluetooth API force-sensing strength analysis for climbers</small>
      </div>
      <div class="header-actions">
        <button type="button" data-toggle-device-list aria-expanded="false" aria-controls="device-list">
          <i class="fa-brands fa-bluetooth"></i>
        </button>
        <button type="button" data-open-settings><i class="fa-solid fa-gear"></i> </button>
      </div>
    </div>
    ${setupDeviceList(isDeviceConnected)}
  </header>
  `
}
