import { BleManager, Device } from "react-native-ble-plx"
import { WHC06 as WHC06Base } from "@hangtime/grip-connect"
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

  constructor() {
    super()
    this.manager = new BleManager()
  }

  private base64ToHex(base64: string): string {
    const binary = Buffer.from(base64, "base64").toString("binary")
    return Array.from(binary)
      .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
      .join("")
  }

  private parseWeightData(manufacturerData: string | null): number {
    if (!manufacturerData) return 0

    try {
      const hexData = this.base64ToHex(manufacturerData)
      const weightHex = hexData.substring(24, 28)
      return parseInt(weightHex, 16) / 100
    } catch (error) {
      console.error("Error parsing weight data:", error)
      return 0
    }
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

          // Handle received data
          this.currentSamplesPerPacket = 1
          this.recordPacketReceived()
          const receivedTime: number = Date.now()
          const receivedData = this.parseWeightData(manufacturerData)

          // Tare correction
          const numericData = receivedData - this.applyTare(receivedData) * -1
          const currentMassTotal = Math.max(-1000, numericData)

          // Update session stats before building packet
          this.peak = Math.max(this.peak, numericData)
          this.min = Math.min(this.min, Math.max(-1000, numericData))
          this.sum += currentMassTotal
          this.dataPointCount++
          this.mean = this.sum / this.dataPointCount

          // Add data to downloadable Array
          this.downloadPackets.push(
            this.buildDownloadPacket(currentMassTotal, [numericData], {
              timestamp: receivedTime,
              sampleIndex: this.dataPointCount,
            }),
          )

          // Check if device is being used
          this.activityCheck(numericData)

          // Notify with weight data
          this.notifyCallback(this.buildForceMeasurement(currentMassTotal))
        }
      })
    } catch (error) {
      onError(error as Error)
    }
  }

  override download = async (): Promise<void> => {
    throw new Error("Download is not supported on React Native")
  }
}
