import {
  Climbro,
  Entralpi,
  Motherboard,
  mySmartBoard,
  Progressor,
  WHC06,
  active,
  battery,
  connect,
  disconnect,
  download,
  firmware,
  hardware,
  led,
  manufacturer,
  notify,
  serial,
  stream,
  stop,
  tare,
  text,
  isMotherboard,
  isEntralpi,
} from "@hangtime/grip-connect"
import type { massObject } from "@hangtime/grip-connect/src/types/notify"
import type { Device } from "@hangtime/grip-connect/src/types/devices"
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
  let device: Device = Motherboard
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
      device = Climbro
    } else if (selectedDevice === "entralpi") {
      device = Entralpi
    } else if (selectedDevice === "motherboard") {
      device = Motherboard
    } else if (selectedDevice === "smartboard") {
      device = mySmartBoard
    } else if (selectedDevice === "progressor") {
      device = Progressor
    } else if (selectedDevice === "whc06") {
      device = WHC06
    }

    return connect(
      device,
      async () => {
        // Show buttons after device is connected
        toggleButtons(true)
        // Listen for notifications
        notify((data: massObject) => {
          // Chart
          addChartData(data.massTotal, data.massMax, data.massAverage)
          chartHeight = Number(data.massMax)
          // HTML
          addMassHTML(data)
        })

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
          outputElement.textContent = batteryLevel
        }

        const firmwareVersion = await firmware(device)
        if (firmwareVersion) {
          console.log("Firmware Version:", firmwareVersion)
          outputElement.textContent = firmwareVersion
        }

        const hardwareVersion = await hardware(device)
        if (hardwareVersion) {
          console.log("Hardware Version:", hardwareVersion)
          outputElement.textContent = hardwareVersion
        }

        const manufacturerInfo = await manufacturer(device)
        if (manufacturerInfo) {
          console.log("Manufacturer Info:", manufacturerInfo)
          outputElement.textContent = manufacturerInfo
        }

        const storedText = await text(device)
        if (storedText) {
          console.log("Stored Text:", storedText)
          outputElement.textContent = storedText
        }

        const serialNumberInfo = await serial(device)
        if (serialNumberInfo) {
          console.log("Serial Number Info:", serialNumberInfo)
          outputElement.textContent = serialNumberInfo
        }
        outputElement.style.display = "none"

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
          disconnect(device)
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
