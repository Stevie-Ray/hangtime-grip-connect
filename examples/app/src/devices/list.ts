export function setupDeviceList(isConnected = false) {
  interface ListedDevice {
    key: string
    name: string
    shortDescription: string
    url: string
    disabled?: boolean
  }

  const devices: ListedDevice[] = [
    {
      key: "progressor",
      name: "Tindeq Progressor",
      shortDescription: "Dynamometer for measuring force",
      url: "https://tindeq.com/product/progressor/",
    },
    {
      key: "dyno",
      name: "Frez Dyno",
      shortDescription: "Dynamometer for isometric strength measurement",
      disabled: true,
      url: "https://shop.frez.app/products/pre-order-frez-dyno",
    },
    {
      key: "forceboard",
      name: "PitchSix Force Board",
      shortDescription: "Dynamometer to records strength metrics",
      url: "https://pitchsix.com/products/force-board-portable",
    },
    {
      key: "whc06",
      name: "Weiheng WH-C06",
      shortDescription: "Crane scale used as affordable dynamometer",
      url: "https://weihengmanufacturer.com/products/wh-c06-bluetooth-300kg-hanging-scale/",
    },
    {
      key: "cts500",
      name: "Jlyscales CTS500",
      shortDescription: "China-made copy of the Tindeq Progressor",
      url: "https://www.alibaba.com/product-detail/Mini-Climbing-Training-Scale-CTS500-Aluminum_1601637814595.html",
    },
    {
      key: "motherboard",
      name: "Griptonite Motherboard",
      shortDescription: "Force sensors for Beastmaker hangboards",
      url: "https://griptonite.io/motherboard/",
    },
    {
      key: "climbro",
      name: "Climbro",
      shortDescription: "Hangboard with an integrated sensor",
      url: "https://climbro.com/",
    },
    {
      key: "smartboard",
      name: "SmartBoard Climbing mySmartBoard",
      shortDescription: "Force sensor for Beastmaker/YYVertical hangboards",
      url: "https://www.smartboard-climbing.com/",
    },
    {
      key: "entralpi",
      name: "Entralpi",
      shortDescription: "Force plate for hangboard training",
      url: "https://entralpi.com/",
    },
    {
      key: "pb700bt",
      name: "NSD PB-700BT",
      shortDescription: "Powerball for wrist/hand exercise",
      url: "https://www.nsd.com.tw/",
    },
  ]

  return `
    <section id="device-list" hidden>
      <ul>
        ${devices
          .map(
            (device) =>
              `<li>
                <div class="device-list-item">
                  <button
                    type="button"
                    data-device-key="${device.key}"
                    data-device-name="${device.name}"
                    ${device.disabled ? "disabled" : ""}
                  >
                    <span class="device-name">${device.name}</span>
                    <span class="device-short-description">${device.shortDescription}</span>
                  </button>
                  <a
                    class="device-link"
                    href="${device.url}"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="${device.name}${device.disabled ? " (device unavailable)" : ""}"
                    title="${device.name}${device.disabled ? " (Unavailable to connect)" : ""}"
                  >
                    <i class="fa-solid fa-arrow-up-right-from-square" aria-hidden="true"></i>
                  </a>
                </div>
              </li>`,
          )
          .join("")}
      </ul>
      ${isConnected ? '<button type="button" class="device-disconnect-btn" data-disconnect-device>Disconnect</button>' : ""}
      <small id="device-connect-status"></small>
    </section>
  `
}
