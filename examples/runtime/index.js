import { FrezDyno } from "@hangtime/grip-connect-runtime"

const dyno = new FrezDyno()

dyno.notify((measurement) => {
  console.log(measurement.current, measurement.unit, measurement.timestamp)
})

await new Promise((resolve, reject) => {
  void dyno.connect(resolve, reject)
})

try {
  console.log("Serial:", await dyno.serial())
  await dyno.stream(5000)
  await dyno.download("json")
} finally {
  dyno.disconnect()
}
