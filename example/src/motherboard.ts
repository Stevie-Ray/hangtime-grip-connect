import Motherboard, { connect, read, write, disconnect } from "@motherboard/core"

export function setupMotherboard(element: HTMLButtonElement) {
  element.addEventListener("click", () =>
    connect(async () => {
      // read battery + device info
      await read(Motherboard.bat)
      await read(Motherboard.devMn)
      await read(Motherboard.devHr)
      await read(Motherboard.devFr)

      // get the stream info
      await write(Motherboard.uartTx, "C", 5000)
      await write(Motherboard.led01, "1", 5000)
      await write(Motherboard.led02, "0", 5000)
      await write(Motherboard.uartTx, "S8", 15000)
      await write(Motherboard.led01, "0", 5000)
      await write(Motherboard.led02, "1", 5000)
      await write(Motherboard.uartTx, "S8", 15000)

      // disconnect from device after we are done
      disconnect()
    }),
  )
}
