import { BleManager, Device } from "react-native-ble-plx"
import { WHC06 as WHC06Base } from "@hangtime/grip-connect/src/index"
import { Buffer } from "buffer"

/**
 * Represents a Weiheng - WH-C06 (or MAT Muscle Meter) device.
 * To use this device enable: `chrome://flags/#enable-experimental-web-platform-features`.
 * {@link https://googlechrome.github.io/samples/web-bluetooth/scan.html| Web Bluetooth}
 * {@link https://weihengmanufacturer.com}
 */
export class WHC06 extends WHC06Base {
  manager: BleManager
  device?: Device
  private readonly weightOffset: number = 10

  constructor() {
    super()
    this.manager = new BleManager()
  }

  private parseWeightData(manufacturerData: string | null): number {
    if (!manufacturerData) return 0

    const buffer = Buffer.from(manufacturerData, "base64")
    const weight = (buffer[this.weightOffset] << 8) | buffer[this.weightOffset + 1]
    return weight / 100
  }

  override connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      this.manager.startDeviceScan(null, { scanMode: 2, callbackType: 1 }, (error, scannedDevice) => {
        if (error) {
          onError(error)
          return
        }

        if (scannedDevice && (scannedDevice.localName === "IF_B7" || scannedDevice.name === "IF_B7")) {
          // Update timestamp
          this.updateTimestamp()

          // Device has no services / characteristics, so we directly call onSuccess
          onSuccess()

          const manufacturerData = scannedDevice.manufacturerData
          // Handle recieved data
          const weight = this.parseWeightData(manufacturerData)

          // Update massMax
          const receivedTime: number = Date.now()
          const receivedData = weight / 100

          // Tare correction
          // 0.20kg - 0.20kg = 0kg
          // 0.40kg - 0.20kg = 0.20kg
          const numericData = receivedData - this.applyTare(receivedData) * -1

          // what i want (if tare is available)
          // 75kg - 75kg = 0
          // 50kg - 75kg = -25kg * -1 = 25kg

          // Add data to downloadable Array
          this.downloadPackets.push({
            received: receivedTime,
            sampleNum: this.dataPointCount,
            battRaw: 0,
            samples: [numericData],
            masses: [numericData],
          })

          // Update massMax
          this.massMax = Math.max(Number(this.massMax), numericData).toFixed(1)

          // Update running sum and count
          const currentMassTotal = Math.max(-1000, numericData)
          this.massTotalSum += currentMassTotal
          this.dataPointCount++

          // Calculate the average dynamically
          this.massAverage = (this.massTotalSum / this.dataPointCount).toFixed(1)

          // Check if device is being used
          this.activityCheck(numericData)

          // Notify with weight data
          this.notifyCallback({
            massMax: this.massMax,
            massAverage: this.massAverage,
            massTotal: Math.max(-1000, numericData).toFixed(1),
          })
        }
      })
    } catch (error) {
      onError(error as Error)
    }
  }
}
