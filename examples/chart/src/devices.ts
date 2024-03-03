import {
  Climbro,
  Entralpi,
  Motherboard,
  mySmartBoard,
  Progressor,
  battery,
  connect,
  disconnect,
  download,
  info,
  notify,
  stream,
  stop,
  tare,
} from "@hangtime/grip-connect"
import { massObject } from "@hangtime/grip-connect/src/notify"
import { Device } from "@hangtime/grip-connect/src/devices/types"
import { Chart } from "chart.js/auto"
import { convertFontAwesome } from "./icons.ts"

const massData: number[] = []
const massMaxData: number[] = []
const massAverageData: number[] = []
let chartElement: HTMLCanvasElement | null = null
let chart: Chart | null = null
let chartHeight: number = 0
/**
 * Sets up the device selection functionality and event listeners for streaming, tare, and download actions.
 *
 * @param {HTMLSelectElement} deviceElement - The HTML element for selecting the device.
 * @param {HTMLButtonElement} streamElement - The HTML button element for streaming.
 * @param {HTMLButtonElement} tareElement - The HTML button element for tare action.
 * @param {HTMLButtonElement} downloadElement - The HTML button element for download action.
 * @param {HTMLDivElement} massesElement - The HTML element to display mass information.
 */
export function setupDevice(
  deviceElement: HTMLSelectElement,
  streamElement: HTMLButtonElement,
  tareElement: HTMLButtonElement,
  downloadElement: HTMLButtonElement,
  massesElement: HTMLDivElement,
) {
  let isStreaming: boolean = true
  let device: Device = Motherboard
  /**
   * Toggles the visibility of buttons.
   *
   * @param {boolean} visible - Whether to make the buttons visible or not.
   */
  function toggleButtons(visible: boolean) {
    deviceElement.style.display = visible ? "none" : "inline-block"
    tareElement.style.display = visible ? "inline-block" : "none"
    downloadElement.style.display = visible ? "inline-block" : "none"
    streamElement.style.display = visible ? "inline-block" : "none"
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
            div.innerHTML = `<label>${label}</label><strong>${value}<span>kg</span></strong>`
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
    }

    return connect(device, async () => {
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

      // read battery + device info
      await battery(device)
      await info(device)

      // start streaming
      await stream(device)
      isStreaming = true

      if (device === Entralpi) {
        setTimeout(() => {
          // the entralpi will automatically start streaming
        }, 60000)
        // disconnect from device after we are done
        disconnect(device)
        // hide buttons
        toggleButtons(false)
      }
    })
  })
  // Tare
  tareElement.addEventListener("click", async () => {
    await tare()
  })
  // Download
  downloadElement.addEventListener("click", async () => {
    download()
  })
  // Stop / Play
  streamElement.addEventListener("click", async () => {
    if (isStreaming) {
      streamElement.innerHTML = "<i class='fa-solid fa-play'></i><span> Start</span>"
      isStreaming = false
      convertFontAwesome()
      await stop(device)
    } else {
      streamElement.innerHTML = "<i class='fa-solid fa-stop'></i><span> Stop</span>"
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

      if (chart?.options?.scales?.y) {
        chart.options.scales.y.max = Math.ceil((chartHeight + 10) / 10) * 10
      }

      chart.update()
    } else {
      console.error("Invalid numeric data:", mass, max, average)
    }
  }
}
