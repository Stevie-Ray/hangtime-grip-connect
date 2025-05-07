import { BleClient, type BleDevice } from "@capacitor-community/bluetooth-le"
import { WHC06 as WHC06Base } from "@hangtime/grip-connect/src/index"

/**
 * Represents a Weiheng - WH-C06 (or MAT Muscle Meter) device.
 * To use this device enable: `chrome://flags/#enable-experimental-web-platform-features`.
 * {@link https://googlechrome.github.io/samples/web-bluetooth/scan.html| Web Bluetooth}
 * {@link https://weihengmanufacturer.com}
 */
export class WHC06 extends WHC06Base {
  device?: BleDevice

  private parseWeightData(manufacturerData: Record<string, DataView> | undefined): number {
    if (!manufacturerData) return 0

    try {
      // Get the manufacturer data for company ID 256
      const data = manufacturerData[256]
      if (!data || !data.buffer || data.byteLength === 0) {
        console.warn("No valid manufacturer data found for company ID 256")
        return 0
      }

      // Convert DataView to hex string
      const hexData = Array.from(new Uint8Array(data.buffer))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("")

      // The weight data should be at offset 24-28 in the hex string
      const weightHex = hexData.substring(24, 28)
      if (!weightHex) {
        console.warn("Could not find weight data in manufacturer data")
        return 0
      }

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
      await BleClient.initialize()

      // const filterOptions = Object.assign({}, ...this.filters)
      // Start scanning for manufacturer data
      await BleClient.requestLEScan(
        {
          manufacturerData: [{ companyIdentifier: 256 }],
          allowDuplicates: true,
        },
        (result) => {
          if (result && (result.device.name === "IF_B7" || result.localName === "IF_B7")) {
            console.log("Device found:", {
              name: result.device.name,
              localName: result.localName,
              manufacturerData: result.manufacturerData,
            })

            // Update timestamp
            this.updateTimestamp()

            // Device has no services / characteristics, so we directly call onSuccess
            onSuccess()

            const manufacturerData = result.manufacturerData
            // Handle received data
            const weight = this.parseWeightData(manufacturerData)

            if (weight === 0) {
              console.warn("No valid weight data received")
              return
            }

            // Update massMax
            const receivedTime: number = Date.now()
            const receivedData = weight

            // Tare correction
            const numericData = receivedData - this.applyTare(receivedData) * -1

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
        },
      )
    } catch (error) {
      onError(error as Error)
    }
  }
}
