export function setupDeviceList() {
  const devices = [
    { key: "climbro", name: "Climbro" },
    { key: "entralpi", name: "Entralpi" },
    { key: "forceboard", name: "Force Board" },
    { key: "motherboard", name: "Motherboard" },
    { key: "pb700bt", name: "PB-700BT" },
    { key: "progressor", name: "Progressor" },
    { key: "smartboard", name: "SmartBoard" },
    { key: "whc06", name: "WHC-06" },
  ]

  return `
    <section id="device-list" hidden>
      <ul>
        ${devices
          .map(
            (device) =>
              `<li><button type="button" data-device-key="${device.key}" data-device-name="${device.name}">${device.name}</button></li>`,
          )
          .join("")}
      </ul>
      <small id="device-connect-status"></small>
    </section>
  `
}
