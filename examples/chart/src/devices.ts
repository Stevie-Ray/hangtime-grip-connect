import {
  Climbro,
  Entralpi,
  Motherboard,
  mySmartBoard,
  Progressor,
  battery,
  connect,
  disconnect,
  info,
  notify,
  stream,
  stop,
  tare,
} from "@hangtime/grip-connect"
import { massObject } from "@hangtime/grip-connect/src/notify"
import { Device } from "@hangtime/grip-connect/src/devices/types"
import { Chart } from "chart.js/auto"

const massData: number[] = []
const massMaxData: number[] = []
const massAverageData: number[] = []
let chartElement: HTMLCanvasElement | null = null
let chart: Chart | null = null
let chartHeight: number = 0

export function outputValue(element: HTMLDivElement, data: string) {
  element.innerHTML = data
}

export function setupDevice(
  element: HTMLSelectElement,
  stopElement: HTMLButtonElement,
  tareElement: HTMLButtonElement,
  outputElement: HTMLDivElement,
) {
  element.addEventListener("change", () => {
    const selectedDevice = element.value
    let device: Device = Motherboard

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
      // Listen for notifications
      notify((data: massObject) => {
        addData(data.massTotal, data.massMax, data.massAverage)
        chartHeight = Number(data.massMax)
        outputValue(outputElement, JSON.stringify(data))
      })

      // read battery + device info
      await battery(device)
      await info(device)

      // start streaming
      await stream(device)

      if (device === Entralpi) {
        setTimeout(() => {
          // the entralpi will automatically start streaming
        }, 60000)
        // disconnect from device after we are done
        disconnect(device)
      }
    })
  })

  tareElement.addEventListener("click", async () => {
    await tare()
  })

  stopElement.addEventListener("click", async () => {
    const selectedDevice = element.value

    if (selectedDevice === "motherboard") {
      await stop(Motherboard)
    }
    if (selectedDevice === "progressor") {
      await stop(Progressor)
    }
  })
}

export function setupChart(element: HTMLCanvasElement) {
  chartElement = element
  if (chartElement) {
    chart = new Chart(chartElement, {
      type: "line",
      data: {
        labels: [],
        datasets: [
          {
            label: "Total Mass",
            data: massData,
            borderWidth: 1,
          },
          {
            label: "Mass Max",
            fill: false,
            borderWidth: 1,
            data: massMaxData,
          },
          {
            label: "Mass Average",
            fill: false,
            borderDash: [5, 5],
            borderWidth: 1,
            data: massAverageData,
          },
        ],
      },
      options: {
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
function addData(mass: string, max: string, average: string) {
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
