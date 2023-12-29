import Motherboard, { connect, disconnect, read, write, notify } from "@hangtime/motherboard"

export function setupMotherboard(element: HTMLButtonElement) {
  element.addEventListener("click", () => {
    return connect(async () => {
      // Listen for notifications
      notify((data: object) => {
        console.log(data)
      })

      // read battery + device info
      await read(Motherboard.bat)
      await read(Motherboard.devMn)
      await read(Motherboard.devHr)
      await read(Motherboard.devFr)

      // Calibrate?
      await write(Motherboard.uartTx, "C", 5000)

      // Read stream?
      await write(Motherboard.led01, "1", 2500)
      await write(Motherboard.led02, "0", 2500)
      await write(Motherboard.uartTx, "S30", 5000)

      // Read stream (2x)?
      await write(Motherboard.led01, "0", 2500)
      await write(Motherboard.led02, "1", 2500)
      await write(Motherboard.uartTx, "S30", 5000)

      // disconnect from device after we are done
      disconnect()
    })
  })
}
