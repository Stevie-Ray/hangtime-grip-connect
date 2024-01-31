import { Motherboard, Entralpi, Tindeq, connect, disconnect, read, write, notify } from "@hangtime/grip-connect"
import { Chart } from "chart.js/auto"

const chartData: number[] = []
let chartElement: HTMLCanvasElement | null = null
let chart: Chart | null = null

export function outputValue(element: HTMLDivElement, data: string) {
  element.innerHTML = data
}

interface massObject {
  massTotal?: string
  massRight?: string
  massLeft?: string
}

export function setupDevice(element: HTMLSelectElement, outputElement: HTMLDivElement) {
  element.addEventListener("change", () => {
    const selectedDevice = element.value

    if (selectedDevice === "motherboard") {
      return connect(Motherboard, async () => {
        // Listen for notifications
        notify((data: { value?: massObject }) => {
          if (data && data.value) {
            if (data.value.massTotal !== undefined) {
              addData(data.value.massTotal)
              outputValue(outputElement, JSON.stringify(data.value))
            } else {
              console.log(data.value)
            }
          }
        })
        // read battery + device info
        await read(Motherboard, "battery", "level", 250)
        await read(Motherboard, "device", "manufacturer", 250)
        await read(Motherboard, "device", "hardware", 250)
        await read(Motherboard, "device", "firmware", 250)

        // read calibration (required before reading data)
        await write(Motherboard, "uart", "tx", "C", 2500)

        // start streaming for a minute
        await write(Motherboard, "uart", "tx", "S30", 60000)

        // end stream
        await write(Motherboard, "uart", "tx", "", 0)
        // disconnect from device after we are done
        disconnect(Motherboard)
      })
    }

    if (selectedDevice === "entralpi") {
      return connect(Entralpi, async () => {
        // Listen for notifications
        notify((data: { value?: massObject }) => {
          if (data && data.value) {
            if (data.value.massTotal !== undefined) {
              addData(data.value.massTotal)
              outputValue(outputElement, JSON.stringify(data.value))
            } else {
              console.log(data.value)
            }
          }
        })
        // disconnect from device after we are done
        disconnect(Entralpi)
      })
    }
    if (selectedDevice === "tindeq") {
      return connect(Tindeq, async () => {
        // Listen for notifications
        // Listen for notifications
        notify((data: { value?: string }) => {
          if (data && data.value) {
            console.log(data.value)
            outputValue(outputElement, data.value)
          }
        })

        // TARE_SCALE (0x64): 'd'
        // START_WEIGHT_MEAS (0x65): 'e'
        // STOP_WEIGHT_MEAS (0x66): 'f'
        // START_PEAK_RFD_MEAS (0x67): 'g'
        // START_PEAK_RFD_MEAS_SERIES (0x68): 'h'
        // ADD_CALIB_POINT (0x69): 'i'
        // SAVE_CALIB (0x6A): 'j'
        // GET_APP_VERSION (0x6B): 'k'
        // GET_ERR_INFO (0x6C): 'l'
        // CLR_ERR_INFO (0x6D): 'm'
        // SLEEP (0x6E): 'n'
        // GET_BATT_VLTG (0x6F): 'o'

        await write(Tindeq, "progressor", "tx", "e", 10000)
        await write(Tindeq, "progressor", "tx", "f", 0)
        // disconnect from device after we are done
        disconnect(Tindeq)
      })
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
