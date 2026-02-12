import {
  Climbro,
  Entralpi,
  ForceBoard,
  Motherboard,
  SmartBoardPro,
  PB700BT,
  Progressor,
  WHC06,
} from "@hangtime/grip-connect"
import type { ForceMeasurement, ForceUnit } from "@hangtime/grip-connect"
import { Chart } from "chart.js/auto"
import { convertFontAwesome } from "./icons.js"
import { releaseWakeLock, requestWakeLock } from "./wake-lock.js"

const connectedDevices: (
  | Climbro
  | Entralpi
  | ForceBoard
  | Motherboard
  | SmartBoardPro
  | PB700BT
  | Progressor
  | WHC06
)[] = []

let chartElement: HTMLCanvasElement | null = null
let chart: Chart | null = null
let chartHeight = 0

/**
 * Sets up the device selection functionality and event listeners for streaming, tare, and download actions.
 *
 * @param {HTMLDivElement} massesElement - The HTML element to display mass information.
 * @param {HTMLDivElement} outputElement - The HTML element to display output/erros.
 */
export function setupDevice(massesElement: HTMLDivElement, outputElement: HTMLDivElement) {
  let isStreaming = true
  let displayUnit: ForceUnit = "kg"
  const deviceNotifyCallbacks = new Map<string, (data: ForceMeasurement) => void>()

  addNewDeviceSelect()

  /**
   * Re-registers notify with the current display unit for all connected devices.
   */
  function applyUnitToAllDevices(): void {
    const unit: ForceUnit = displayUnit ?? "kg"
    connectedDevices.forEach((d) => {
      const cb = d.id != null ? deviceNotifyCallbacks.get(d.id) : undefined
      if (cb) d.notify(cb, unit)
    })
  }

  /**
   * Function to add a new device select element for selecting another device.
   */
  function addNewDeviceSelect() {
    // Create new device div
    const newDeviceControlDiv = document.createElement("div")
    newDeviceControlDiv.classList.add("input")

    // Create the "Device" select
    const newSelectElement = document.createElement("select")
    newSelectElement.innerHTML = `
      <option value="">Select device</option>
      <option value="climbro">Climbro</option>
      <option value="entralpi">Entralpi</option>
      <option value="forceboard">Force Board</option>
      <option value="motherboard">Motherboard</option>
      <option value="pb700bt">PB-700BT</option>
      <option value="progressor">Progressor</option>
      <option value="smartboard">SmartBoard</option>
      <option value="whc06">WH-C06</option>
    `
    newDeviceControlDiv.appendChild(newSelectElement)

    // Append the new select div to the card container in the DOM
    document.querySelector(".card")?.appendChild(newDeviceControlDiv)

    // Add event listener for the new device select
    newSelectElement.addEventListener("change", () => {
      handleDeviceSelection(newSelectElement)
    })
  }

  function addNewDeviceControl(
    device: Climbro | Entralpi | ForceBoard | Motherboard | SmartBoardPro | PB700BT | Progressor | WHC06 | undefined,
  ) {
    const deviceControlDiv = document.querySelector(".card .input:last-of-type")
    if (deviceControlDiv && device) {
      deviceControlDiv.classList.add(`input-${device.id}`)
      deviceControlDiv.innerHTML = ""

      const nameRow = document.createElement("div")
      const deviceName = document.createElement("strong")
      deviceName.textContent = device.constructor.name
      nameRow.appendChild(deviceName)
      const settingsBtn = document.createElement("button")
      settingsBtn.type = "button"
      settingsBtn.innerHTML = `<i class="fa-solid fa-gear"></i>`
      settingsBtn.addEventListener("click", () => {
        const d = document.getElementById(`dialog-${device.id}`) as HTMLDialogElement
        if (d) {
          const sel = d.querySelector<HTMLSelectElement>("select[name=unit]")
          if (sel) sel.value = displayUnit
          updatePerformanceDisplay(device.id ?? undefined, deviceMassData[device.id ?? ""]?.performance)
          d.showModal()
        }
      })
      nameRow.appendChild(settingsBtn)
      deviceControlDiv.parentElement?.insertBefore(nameRow, deviceControlDiv)

      const settingsDialog = document.createElement("dialog")
      settingsDialog.id = `dialog-${device.id}`
      settingsDialog.innerHTML = `
        <form method="dialog">
          <h3>Settings</h3>
          <div id="performance-${device.id}" data-device-id="${device.id}">
            <h4>Performance</h4>
            <div class="performance-metrics">
              <div class="performance-row">
                <div class="performance-metric">
                  <span class="performance-value" data-metric="hz"></span>
                  <strong class="performance-label">Data rate</strong>
                </div>
                <div class="performance-metric">
                  <span class="performance-value" data-metric="interval"></span>
                  <strong class="performance-label">Notify interval</strong>
                </div>
              </div>
              <div class="performance-row">
                <div class="performance-metric">
                  <span class="performance-value" data-metric="packets"></span>
                  <strong class="performance-label">Packets</strong>
                </div>
                <div class="performance-metric">
                  <span class="performance-value" data-metric="samples"></span>
                  <strong class="performance-label">Samples/packet</strong>
                </div>
              </div>
              <div class="performance-row">
                <div class="performance-metric">
                  <span class="performance-value" data-metric="sampleIndex"></span>
                  <strong class="performance-label">Sample index</strong>
                </div>
              </div>
            </div>
          </div>
          <p>
            <label for="unit-select-${device.id}">Unit</label>
            <select id="unit-select-${device.id}" name="unit">
              <option value="kg">kg</option>
              <option value="lbs">lbs</option>
            </select>
          </p>

          <menu>
            <button type="submit" value="apply">Apply</button>
            <button type="submit" value="cancel">Cancel</button>
          </menu>
        </form>
      `
      settingsDialog.querySelector("form")?.addEventListener("submit", (e) => {
        e.preventDefault()
        const form = e.target as HTMLFormElement
        if ((e.submitter as HTMLButtonElement)?.value === "apply") {
          const sel = form.querySelector<HTMLSelectElement>("select[name=unit]")
          if (sel) {
            displayUnit = sel.value as ForceUnit
            applyUnitToAllDevices()
          }
        }
        settingsDialog.close()
      })
      const unitSelectInDialog = settingsDialog.querySelector<HTMLSelectElement>("select[name=unit]")
      if (unitSelectInDialog) unitSelectInDialog.value = displayUnit
      deviceControlDiv.appendChild(settingsDialog)

      // Create the "Disconnect" button
      const disconnectButton = document.createElement("button")
      disconnectButton.innerHTML = `
    <div>
      <i class="fa-solid fa-link-slash"></i>
    </div>
    <div>Disconnect</div>
  `
      disconnectButton.addEventListener("click", async () => {
        await device.disconnect()
        const idx = connectedDevices.indexOf(device)
        if (idx >= 0) connectedDevices.splice(idx, 1)
        if (connectedDevices.length === 0) await releaseWakeLock()
      })
      deviceControlDiv.appendChild(disconnectButton)

      // Create the "Stop" button
      const streamButton = document.createElement("button")
      streamButton.innerHTML = `
    <div>
      <i class="fa-solid fa-stop"></i>
    </div>
    <div>Stop</div>
  `
      streamButton.addEventListener("click", async () => {
        if (isStreaming) {
          streamButton.innerHTML = "<div><i class='fa-solid fa-play'></i></div><div>Start</div>"
          isStreaming = false
          convertFontAwesome()

          if (device instanceof Motherboard || device instanceof Progressor || device instanceof ForceBoard) {
            await device.stop()
          }
        } else {
          streamButton.innerHTML = "<div><i class='fa-solid fa-stop'></i></div><div>Stop</div>"
          isStreaming = true
          convertFontAwesome()
          if (device instanceof Motherboard || device instanceof Progressor || device instanceof ForceBoard) {
            await device.stream()
          }
        }
      })

      deviceControlDiv.appendChild(streamButton)

      // Create the "Tare" button
      const tareButton = document.createElement("button")
      tareButton.innerHTML = `
    <div>
      <i class="fa-solid fa-scale-balanced"></i>
      <small>5 sec</small>
    </div>
    <div>Tare</div>
  `
      tareButton.addEventListener("click", () => {
        device.tare()
      })

      deviceControlDiv.appendChild(tareButton)

      // Create the "Download CSV" button
      const downloadButton = document.createElement("button")
      downloadButton.innerHTML = `
    <div>
      <i class="fa-solid fa-download"></i>
      <small>CSV</small>
    </div>
    <div>Download</div>
  `
      downloadButton.addEventListener("click", () => {
        device.download()
      })

      deviceControlDiv.appendChild(downloadButton)

      // Append the new select div to the card container in the DOM
      document.querySelector(".card")?.appendChild(deviceControlDiv)
      convertFontAwesome()
    }
  }

  // Track mass data for each device
  const deviceMassData: Record<string, ForceMeasurement> = {}

  /**
   * Updates the performance metrics display in the settings dialog for a device.
   *
   * @param deviceId - The unique device ID.
   * @param performance - Optional performance metadata from ForceMeasurement.
   */
  function updatePerformanceDisplay(deviceId: string | undefined, performance?: ForceMeasurement["performance"]): void {
    if (!deviceId) return
    const card = document.getElementById(`performance-${deviceId}`)
    if (!card) return

    const hzEl = card.querySelector("[data-metric=hz]")
    const intervalEl = card.querySelector("[data-metric=interval]")
    const packetsEl = card.querySelector("[data-metric=packets]")
    const samplesEl = card.querySelector("[data-metric=samples]")
    const sampleIndexEl = card.querySelector("[data-metric=sampleIndex]")

    if (performance) {
      if (hzEl && performance.samplingRateHz != null) {
        hzEl.textContent = performance.samplingRateHz.toFixed(1) + " Hz"
      }
      if (intervalEl && performance.notifyIntervalMs != null) {
        intervalEl.textContent = performance.notifyIntervalMs.toFixed(2) + " ms"
      }
      if (packetsEl && performance.packetIndex != null) {
        packetsEl.textContent = String(performance.packetIndex)
      }
      if (samplesEl && performance.samplesPerPacket != null) {
        samplesEl.textContent = String(performance.samplesPerPacket)
      }
      if (sampleIndexEl && performance.sampleIndex != null) {
        sampleIndexEl.textContent = String(performance.sampleIndex)
      }
    } else {
      if (hzEl) hzEl.textContent = "--"
      if (intervalEl) intervalEl.textContent = "--"
      if (packetsEl) packetsEl.textContent = "--"
      if (samplesEl) samplesEl.textContent = "--"
      if (sampleIndexEl) sampleIndexEl.textContent = "--"
    }
  }

  /**
   * Adds mass data to the HTML element for each device.
   *
   * @param {string} id - The unique device ID.
   * @param {ForceMeasurement} data - The force measurement object.
   */
  function addMassHTML(id: string | undefined, data: ForceMeasurement): void {
    if (!id || !massesElement) return
    // Store mass data for this device
    deviceMassData[id] = data

    // Check if a child div for the device exists
    let deviceDiv = document.getElementById(`device-${id}`)

    // If the child div does not exist, create it
    if (!deviceDiv) {
      deviceDiv = document.createElement("div")
      deviceDiv.id = `device-${id}`
      deviceDiv.className = "device-mass"
      massesElement.appendChild(deviceDiv)
    } else {
      // Clear the existing content for this device's div
      deviceDiv.innerHTML = ""
    }

    const unitSuffix = ` ${data.unit}`
    const rows: { label: string; value: number }[] = [
      { label: "Current", value: data.current },
      { label: "Max", value: data.peak },
      { label: "Average", value: data.mean },
    ]
    if (data.distribution) {
      if (data.distribution.left !== undefined) rows.push({ label: "Left", value: data.distribution.left.current })
      if (data.distribution.center !== undefined)
        rows.push({ label: "Center", value: data.distribution.center.current })
      if (data.distribution.right !== undefined) rows.push({ label: "Right", value: data.distribution.right.current })
    }
    for (const { label, value } of rows) {
      const valueDiv = document.createElement("div")
      valueDiv.innerHTML = `<label>${label}</label><strong>${value.toFixed(2)}<span>${unitSuffix}</span></strong>`
      deviceDiv.appendChild(valueDiv)
    }
  }

  /**
   * Handles device selection and connects to the selected device.
   *
   * @param {HTMLSelectElement} selectElement - The device select element.
   */
  function handleDeviceSelection(selectElement: HTMLSelectElement) {
    let device: Climbro | Entralpi | ForceBoard | Motherboard | SmartBoardPro | PB700BT | Progressor | WHC06 | null =
      null
    const selectedDevice = selectElement.value

    if (selectedDevice === "climbro") {
      device = new Climbro()
    } else if (selectedDevice === "entralpi") {
      device = new Entralpi()
    } else if (selectedDevice === "forceboard") {
      device = new ForceBoard()
    } else if (selectedDevice === "motherboard") {
      device = new Motherboard()
    } else if (selectedDevice === "smartboard") {
      device = new SmartBoardPro()
    } else if (selectedDevice === "pb700bt") {
      device = new PB700BT()
    } else if (selectedDevice === "progressor") {
      device = new Progressor()
    } else if (selectedDevice === "whc06") {
      device = new WHC06()
    }

    device?.connect(
      async () => {
        addNewDeviceControl(device)

        connectedDevices.push(device)
        await requestWakeLock()

        const notifyCb = (data: ForceMeasurement) => {
          addChartData(device, data.current, data.peak, data.mean)
          chartHeight = data.peak
          addMassHTML(device.id, data)
          const dialog = document.getElementById(`dialog-${device.id}`) as HTMLDialogElement | null
          if (dialog?.open) {
            updatePerformanceDisplay(device.id ?? undefined, data.performance)
          }
        }
        if (device.id != null) deviceNotifyCallbacks.set(device.id, notifyCb)
        device.notify(notifyCb, displayUnit ?? "kg")

        // Example Reactive check if device is active, optionally using a weight threshold and duration
        device.active(
          (isActive: boolean) => {
            console.log(isActive)
          },
          { threshold: 2.5, duration: 1000 },
        )

        // Display device specific information
        if (
          device instanceof Entralpi ||
          device instanceof ForceBoard ||
          device instanceof Motherboard ||
          device instanceof Progressor
        ) {
          // Show output div for selected devices
          outputElement.style.display = "flex"

          const batteryLevel = await device.battery()
          if (batteryLevel) {
            console.log("Battery Level:", batteryLevel)
            outputElement.textContent += `Battery Level: ${batteryLevel}\r\n`
          }
        }

        if (device instanceof Entralpi || device instanceof Motherboard || device instanceof Progressor) {
          const firmwareRevision = await device.firmware()
          if (firmwareRevision) {
            console.log("Firmware Revision:", firmwareRevision)
            outputElement.textContent += `Firmware Revision: ${firmwareRevision}\r\n`
          }
        }

        if (device instanceof Entralpi || device instanceof ForceBoard || device instanceof Motherboard) {
          const manufacturerName = await device.manufacturer()
          if (manufacturerName) {
            console.log("Manufacturer Name:", manufacturerName)
            outputElement.textContent += `Manufacturer Name: ${manufacturerName}\r\n`
          }
        }

        if (device instanceof Entralpi || device instanceof Motherboard) {
          const hardwareRevision = await device.hardware()
          if (hardwareRevision) {
            console.log("Hardware Revision:", hardwareRevision)
            outputElement.textContent += `Hardware Revision: ${hardwareRevision}\r\n`
          }
        }

        if (device instanceof Entralpi) {
          const modelNumber = await device.model()
          if (modelNumber) {
            console.log("Model Number:", modelNumber)
            outputElement.textContent += `Model Number: ${modelNumber}\r\n`
          }

          const softwareRevision = await device.software()
          if (softwareRevision) {
            console.log("Software Revision:", softwareRevision)
            outputElement.textContent += `Software Revision: ${softwareRevision}\r\n`
          }
        }

        if (device instanceof ForceBoard) {
          const humidityLevel = await device.humidity()
          if (humidityLevel) {
            console.log("Humidity Level:", humidityLevel)
            outputElement.textContent += `Humidity Level: ${humidityLevel}\r\n`
          }
          const temperatureLevel = Number(await device.temperature())
          if (temperatureLevel) {
            const celsius = ((temperatureLevel - 32) * 5) / 9
            console.log("Temperature Level Fahrenheit:", temperatureLevel.toString())
            console.log("Temperature Level in Celsius:", celsius.toFixed(1))
            outputElement.textContent += `Temperature Level: ${temperatureLevel.toString()}°F / ${celsius.toFixed(
              1,
            )}°C\r\n`
          }
        }

        if (device instanceof Motherboard) {
          const storedText = await device.text()
          if (storedText) {
            console.log("Stored Text:", storedText)
            outputElement.textContent += `Stored Text: ${storedText}\r\n`
          }

          const serialNumber = await device.serial()
          if (serialNumber) {
            console.log("Serial Number:", serialNumber)
            outputElement.textContent += `Serial Number: ${serialNumber}\r\n`
          }
        }
        // outputElement.style.display = "none"

        // Trigger LEDs
        if (device instanceof Motherboard) {
          await device.led("green")
          await device.led("red")
          await device.led("orange")
          await device.led()
        }

        // Start streaming
        if (device instanceof Motherboard || device instanceof Progressor || device instanceof ForceBoard) {
          await device.stream()
        }

        if (
          device instanceof Entralpi ||
          // TODO:device instanceof ForceBoard ||
          device instanceof Motherboard ||
          device instanceof Progressor ||
          device instanceof WHC06
        ) {
          isStreaming = true
        }
        addNewDeviceSelect()
      },
      (error: Error) => {
        outputElement.innerHTML = error.message
        outputElement.style.display = "flex"
      },
    )
  }
}

// Map to store dataset indices by device ID
const deviceDatasets: Record<string, { currentIndex: number; peakIndex: number; meanIndex: number }> = {}

/**
 * Sets up the chart with the provided HTML canvas element.
 *
 * @param {HTMLCanvasElement} element - The HTML canvas element for the chart.
 */
export function setupChart(element: HTMLCanvasElement) {
  chartElement = element
  if (chartElement) {
    chart = new Chart(chartElement, {
      type: "line",
      data: {
        labels: [],
        datasets: [],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        elements: {
          point: {
            radius: 0,
          },
        },
        plugins: {
          legend: {
            // display: false,
          },
          tooltip: {},
        },
        scales: {
          x: {
            display: false,
          },
          y: {
            min: 0,
            max: 100,
          },
        },
      },
    })
  }
}

/**
 * Adds new data to the chart for a specific device.
 *
 * @param {Climbro | Entralpi | ForceBoard | Motherboard | SmartBoardPro | PB700BT | Progressor | WHC06} device - The device.
 * @param {number} current - The current force value.
 * @param {number} peak - The peak force value.
 * @param {number} mean - The mean force value.
 */
function addChartData(
  device: Climbro | Entralpi | ForceBoard | Motherboard | SmartBoardPro | PB700BT | Progressor | WHC06,
  current: number,
  peak: number,
  mean: number,
) {
  if (chart && device !== undefined) {
    const numericCurrent = current
    const numericPeak = peak
    const numericMean = mean

    if (!isNaN(numericCurrent) && !isNaN(numericPeak) && !isNaN(numericMean)) {
      const label = new Date().toLocaleTimeString() // Example label

      // Add label to all datasets
      chart.data.labels?.push(label)
      if (chart.data.labels && chart.data.labels.length >= 100) {
        chart.data.labels.shift()
      }

      // Check if we have datasets for this device ID
      if (device.id && !deviceDatasets[device.id]) {
        // If not, create the datasets for this device
        const currentDataset = {
          label: `${device.constructor.name} Current`,
          data: [],
          borderWidth: 1,
          backgroundColor: "#36a2eb",
          borderColor: "#36a2eb",
        }

        const peakDataset = {
          label: `${device.constructor.name} Peak`,
          data: [],
          fill: false,
          borderWidth: 1,
          backgroundColor: "#ff6383",
          borderColor: "#ff6383",
        }

        const meanDataset = {
          label: `${device.constructor.name} Mean`,
          data: [],
          fill: false,
          borderDash: [5, 5],
          borderWidth: 1,
          backgroundColor: "#ff9f40",
          borderColor: "#ff9f40",
        }

        // Add datasets to the chart
        chart.data.datasets.push(currentDataset, peakDataset, meanDataset)

        // Store the indices of the datasets for this device
        deviceDatasets[device.id] = {
          currentIndex: chart.data.datasets.length - 3,
          peakIndex: chart.data.datasets.length - 2,
          meanIndex: chart.data.datasets.length - 1,
        }
      }

      if (device.id) {
        // Retrieve the dataset indices for this device
        const { currentIndex, peakIndex, meanIndex } = deviceDatasets[device.id]

        // Update the datasets with new data
        chart.data.datasets[currentIndex].data.push(numericCurrent)
        chart.data.datasets[peakIndex].data.push(numericPeak)
        chart.data.datasets[meanIndex].data.push(numericMean)

        const maxEntries = 100

        // Ensure dataset length doesn't exceed 100 entries
        if (chart.data.datasets[currentIndex].data.length >= maxEntries) {
          chart.data.datasets[currentIndex].data.shift()
        }
        if (chart.data.datasets[peakIndex].data.length >= maxEntries) {
          chart.data.datasets[peakIndex].data.shift()
        }
        if (chart.data.datasets[meanIndex].data.length >= maxEntries) {
          chart.data.datasets[meanIndex].data.shift()
        }
      }

      // Optionally update the y-axis max value
      if (chart.options.scales?.["y"]) {
        chart.options.scales["y"].max = Math.ceil((chartHeight + 10) / 10) * 10
      }

      chart.update()
    } else {
      console.error("Invalid numeric data:", current, peak, mean)
    }
  }
}
