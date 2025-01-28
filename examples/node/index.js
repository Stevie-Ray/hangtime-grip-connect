import { Progressor } from "@hangtime/grip-connect"

const progressor = new Progressor()

progressor.connect(
  async () => {
    await progressor.stream(5000)
  },
)
