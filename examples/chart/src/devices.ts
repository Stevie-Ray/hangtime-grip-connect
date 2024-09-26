import {
  Climbro,
  // Entralpi,
  ForceBoard,
  // Motherboard,
  mySmartBoard,
  // Progressor,
  // WHC06,
  active,
  battery,
  download,
  firmware,
  hardware,
  humidity,
  led,
  manufacturer,
  notify,
  serial,
  stream,
  stop,
  tare,
  text,
  isEntralpi,
  isMotherboard,
} from "@hangtime/grip-connect"
import type { massObject } from "@hangtime/grip-connect/src/types/notify"
import { Device } from "@hangtime/grip-connect/src/models/device.model"
import { Entralpi } from "@hangtime/grip-connect/src/models/device/entralpi.model"
import { Motherboard } from "@hangtime/grip-connect/src/models/device/motherboard.model"
import { Progressor } from "@hangtime/grip-connect/src/models/device/progressor.model"
import { WHC06 } from "@hangtime/grip-connect/src/models/device/wh-c06.model"
import { type IDevice } from "@hangtime/grip-connect/src/interfaces/device.interface"
import { Chart } from "chart.js/auto"
import { convertFontAwesome } from "./icons"

const massData: number[] = []
const massMaxData: number[] = []
const massAverageData: number[] = []
let chartElement: HTMLCanvasElement | null = null
let chart: Chart | null = null
let chartHeight = 0
/**
 * Sets up the device selection functionality and event listeners for streaming, tare, and download actions.
 *
 * @param {HTMLSelectElement} deviceElement - The HTML element for selecting the device.
 * @param {HTMLButtonElement} streamElement - The HTML button element for streaming.
 * @param {HTMLButtonElement} tareElement - The HTML button element for tare action.
 * @param {HTMLButtonElement} downloadElement - The HTML button element for download action.
 * @param {HTMLDivElement} massesElement - The HTML element to display mass information.
 * @param {HTMLDivElement} outputElement - The HTML element to display output/erros.
 */
export function setupDevice(
  deviceElement: HTMLSelectElement,
  streamElement: HTMLButtonElement,
  tareElement: HTMLButtonElement,
  downloadElement: HTMLButtonElement,
  massesElement: HTMLDivElement,
  outputElement: HTMLDivElement,
) {
  let isStreaming = true
  let selected: IDevice = ForceBoard
  let device: Device
  /**
   * Toggles the visibility of buttons.
   *
   * @param {boolean} visible - Whether to make the buttons visible or not.
   */
  function toggleButtons(visible: boolean) {
    deviceElement.style.display = visible ? "none" : "inline-flex"
    tareElement.style.display = visible ? "inline-flex" : "none"
    downloadElement.style.display = visible ? "inline-flex" : "none"
    streamElement.style.display = visible ? "inline-flex" : "none"
  }
  /**
   * Adds mass data to the HTML element.
   *
   * @param {massObject} data - The mass data object.
   */
  function addMassHTML(data: massObject) {
    if (!massesElement) return
    // Clear existing content
    massesElement.innerHTML = ""

    for (const property in data) {
      if (Object.prototype.hasOwnProperty.call(data, property)) {
        const valueString = data[property as keyof massObject]
        if (valueString !== undefined) {
          const value = parseFloat(valueString)
          if (!isNaN(value)) {
            const label = property.replace("mass", "")
            const div = document.createElement("div")
            div.innerHTML = `<label>${label}</label><strong>${value.toString()}<span>kg</span></strong>`
            massesElement.appendChild(div)
          }
        }
      }
    }
  }
  // Device
  deviceElement.addEventListener("change", () => {
    const selectedDevice = deviceElement.value

    if (selectedDevice === "climbro") {
      selected = Climbro
      device = new Device(selected)
    } else if (selectedDevice === "entralpi") {
      device = new Entralpi()
    } else if (selectedDevice === "forceboard") {
      selected = ForceBoard
      device = new Device(selected)
    } else if (selectedDevice === "motherboard") {
      device = new Motherboard()
    } else if (selectedDevice === "smartboard") {
      selected = mySmartBoard
      device = new Device(selected)
    } else if (selectedDevice === "progressor") {
      device = new Progressor()
    } else if (selectedDevice === "whc06") {
      device = new WHC06()
    }

    notify((data: massObject) => {
      console.log("fire")
      // Chart
      addChartData(data.massTotal, data.massMax, data.massAverage)
      chartHeight = Number(data.massMax)
      // HTML
      addMassHTML(data)
    })

    device.connect(
      async () => {
        // Show buttons after device is connected
        toggleButtons(true)

        // Example Reactive check if device is active, optionally using a weight threshold and duration
        active(
          (isActive: boolean) => {
            console.log(isActive)
          },
          { threshold: 2.5, duration: 1000 },
        )

        // Read all stored information
        outputElement.style.display = "flex"
        const batteryLevel = await battery(device)
        if (batteryLevel) {
          console.log("Battery Level:", batteryLevel)
          outputElement.textContent += `Battery Level: ${batteryLevel}\r\n`
        }

        const firmwareVersion = await firmware(device)
        if (firmwareVersion) {
          console.log("Firmware Version:", firmwareVersion)
          outputElement.textContent += `Firmware Version: ${firmwareVersion}\r\n`
        }

        const hardwareVersion = await hardware(device)
        if (hardwareVersion) {
          console.log("Hardware Version:", hardwareVersion)
          outputElement.textContent += `Hardware Version: ${hardwareVersion}\r\n`
        }

        const manufacturerInfo = await manufacturer(device)
        if (manufacturerInfo) {
          console.log("Manufacturer Info:", manufacturerInfo)
          outputElement.textContent += `Manufacturer Info: ${manufacturerInfo}\r\n`
        }

        const storedText = await text(device)
        if (storedText) {
          console.log("Stored Text:", storedText)
          outputElement.textContent += `Stored Text: ${storedText}\r\n`
        }

        const serialNumberInfo = await serial(device)
        if (serialNumberInfo) {
          console.log("Serial Number Info:", serialNumberInfo)
          outputElement.textContent += `Serial Number Info: ${serialNumberInfo}\r\n`
        }

        const humidityLevel = await humidity(device)
        if (humidityLevel) {
          console.log("Humidity Level:", humidityLevel)
          outputElement.textContent += `Humidity Level: ${humidityLevel}\r\n`
        }
        // outputElement.style.display = "none"

        // Trigger LEDs
        if (isMotherboard(device)) {
          await led(device, "green")
          await led(device, "red")
          await led(device, "orange")
          await led(device)
        }

        // Start streaming
        await stream(device)
        isStreaming = true

        if (isEntralpi(device)) {
          setTimeout(() => {
            // the entralpi will automatically start streaming
          }, 60000)
          // disconnect from device after we are done
          device.disconnect()
          // hide buttons
          toggleButtons(false)
        }
      },
      (error: Error) => {
        outputElement.innerHTML = error.message
        outputElement.style.display = "flex"
      },
    )
  })
  // Tare
  tareElement.addEventListener("click", async () => {
    tare()
  })
  // Download
  downloadElement.addEventListener("click", async () => {
    download()
  })
  // Stop / Play
  streamElement.addEventListener("click", async () => {
    if (isStreaming) {
      streamElement.innerHTML = "<div><i class='fa-solid fa-play'></i></div><div>Start</div>"
      isStreaming = false
      convertFontAwesome()
      await stop(device)
    } else {
      streamElement.innerHTML = "<div><i class='fa-solid fa-stop'></i></div><div>Stop</div>"
      isStreaming = true
      convertFontAwesome()
      await stream(device)
    }
  })
}
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
        datasets: [
          {
            label: "Total",
            data: massData,
            borderWidth: 1,
          },
          {
            label: "Max",
            fill: false,
            borderWidth: 1,
            data: massMaxData,
          },
          {
            label: "Average",
            fill: false,
            borderDash: [5, 5],
            borderWidth: 1,
            data: massAverageData,
          },
        ],
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
 * Adds new data to the chart.
 *
 * @param {string} mass - The total mass data.
 * @param {string} max - The maximum mass data.
 * @param {string} average - The average mass data.
 */
function addChartData(mass: string, max: string, average: string) {
  if (chart) {
    const numericMass = parseFloat(mass)
    const numericMax = parseFloat(max)
    const numericAverage = parseFloat(average)

    if (!isNaN(numericMass) && !isNaN(numericMax) && !isNaN(numericAverage)) {
      const label = new Date().toLocaleTimeString() // Example label

      chart.data.labels?.push(label)
      if (chart.data.labels && chart.data.labels.length >= 100) {
        chart.data.labels.shift()
      }

      chart.data.datasets[0].data.push(numericMass)
      if (chart.data.datasets[0].data.length >= 100) {
        chart.data.datasets[0].data.shift()
        massData.shift()
      }

      chart.data.datasets[1].data.push(numericMax)
      if (chart.data.datasets[1].data.length >= 100) {
        chart.data.datasets[1].data.shift()
        massMaxData.shift()
      }

      chart.data.datasets[2].data.push(numericAverage)
      if (chart.data.datasets[2].data.length >= 100) {
        chart.data.datasets[2].data.shift()
        massAverageData.shift()
      }

      if (chart.options.scales?.y) {
        chart.options.scales.y.max = Math.ceil((chartHeight + 10) / 10) * 10
      }

      chart.update()
    } else {
      console.error("Invalid numeric data:", mass, max, average)
    }
  }
}
