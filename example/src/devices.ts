import { Motherboard, Entralpi, Tindeq, connect, disconnect, read, write, notify } from "@hangtime/grip-connect"

export function outputvalue(element: HTMLDivElement, data: string) {
  element.innerHTML = data
}

export function setupMotherboard(element: HTMLButtonElement, outputElement: HTMLDivElement) {
  element.addEventListener("click", () => {
    return connect(Motherboard, async () => {
      // Listen for notifications
      notify((data: { value?: string }) => {
        if (data && data.value) {
          if (typeof data.value === "object") {
            outputvalue(outputElement, JSON.stringify(data.value))
          } else {
            outputvalue(outputElement, data.value)
          }
        }
      })
      // read battery + device info
      await read(Motherboard, "battery", "level", 1000)
      await read(Motherboard, "device", "manufacturer", 1000)
      await read(Motherboard, "device", "hardware", 1000)
      await read(Motherboard, "device", "firmware", 1000)

      // Calibrate?
      await write(Motherboard, "uart", "tx", "C", 10000)

      // // Read value?
      await write(Motherboard, "unknown", "01", "1", 2500)
      await write(Motherboard, "unknown", "02", "0", 2500)
      await write(Motherboard, "uart", "tx", "S30", 5000)
      //
      // // Read value (2x)?
      await write(Motherboard, "unknown", "01", "0", 2500)
      await write(Motherboard, "unknown", "02", "1", 2500)
      await write(Motherboard, "uart", "tx", "S30", 5000)

      // disconnect from device after we are done
      disconnect(Motherboard)
    })
  })
}

export function setupEntralpi(element: HTMLButtonElement, outputElement: HTMLDivElement) {
  element.addEventListener("click", () => {
    return connect(Entralpi, async () => {
      // Listen for notifications
      // Listen for notifications
      notify((data: { value?: string }) => {
        if (data && data.value) {
          console.log(data.value)
          outputvalue(outputElement, data.value)
        }
      })
      // disconnect from device after we are done
      disconnect(Entralpi)
    })
  })
}

export function setupTindeq(element: HTMLButtonElement, outputElement: HTMLDivElement) {
  element.addEventListener("click", () => {
    return connect(Tindeq, async () => {
      // Listen for notifications
      // Listen for notifications
      notify((data: { value?: string }) => {
        if (data && data.value) {
          console.log(data.value)
          outputvalue(outputElement, data.value)
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
  })
}
