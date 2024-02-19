import {
  Climbro,
  Entralpi,
  Motherboard,
  SmartBoard,
  Progressor,
  battery,
  connect,
  disconnect,
  info,
  notify,
  stream,
  stop,
} from "@hangtime/grip-connect"
import { massObject } from "@hangtime/grip-connect/src/notify"
import { Device } from "@hangtime/grip-connect/src/devices/types"
import { Chart } from "chart.js/auto"

const chartData: number[] = []
let chartElement: HTMLCanvasElement | null = null
let chart: Chart | null = null

export function outputValue(element: HTMLDivElement, data: string) {
  element.innerHTML = data
}

export function setupDevice(element: HTMLSelectElement, stopElement: HTMLButtonElement, outputElement: HTMLDivElement) {
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
      device = SmartBoard
    } else if (selectedDevice === "progressor") {
      device = Progressor
    }

    return connect(device, async () => {
      // Listen for notifications
      notify((data: massObject) => {
        addData(data.massTotal)
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
            data: chartData,
            borderWidth: 1,
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
            display: false,
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

function addData(data: string) {
  if (chart) {
    const numericData = parseFloat(data)
    if (!isNaN(numericData)) {
      chart.data.labels?.push("")
      if (chart.data.labels && chart.data.labels.length >= 100) {
        chart.data.labels.shift()
      }
      chart.data.datasets.forEach((dataset) => {
        dataset.data.push(numericData)
        if (dataset.data.length >= 100) {
          dataset.data.shift()
        }
      })
      chart.update()
    } else {
      console.error("Invalid numeric data:", data)
    }
  }
}
