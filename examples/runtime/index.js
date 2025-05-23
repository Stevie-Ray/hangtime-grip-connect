import { Progressor } from "@hangtime/grip-connect-cli"

const progressor = new Progressor()

progressor.connect(
  async () => {
    const batteryLevel = await progressor.battery()
    console.log(batteryLevel)

    const firmwareVersion = await progressor.firmware()
    console.log(firmwareVersion)

    await progressor.stream(5000)

    await progressor.download()

    progressor.disconnect()
  },
)
