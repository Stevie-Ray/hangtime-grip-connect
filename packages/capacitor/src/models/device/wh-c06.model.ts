import { BleClient, type BleDevice } from "@capacitor-community/bluetooth-le"
import { Directory, Filesystem } from "@capacitor/filesystem"
import { WHC06 as WHC06Base } from "@hangtime/grip-connect"

/**
 * Represents a Weiheng - WH-C06 (or MAT Muscle Meter) device.
 * To use this device enable: `chrome://flags/#enable-experimental-web-platform-features`.
 * {@link https://googlechrome.github.io/samples/web-bluetooth/scan.html| Web Bluetooth}
 * {@link https://weihengmanufacturer.com}
 */
export class WHC06 extends WHC06Base {
  device?: BleDevice

  private readonly weightOffset: number = 10

  override connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      await BleClient.initialize()

      const filterOptions = Object.assign({}, ...this.filters)
      await BleClient.requestLEScan(
        {
          ...filterOptions,
          allowDuplicates: true,
        },
        (result) => {
          if (result && (result.device.name === "IF_B7" || result.localName === "IF_B7")) {
            // Update timestamp
            this.updateTimestamp()

            // Device has no services / characteristics, so we directly call onSuccess
            onSuccess()

            const manufacturerData = result.manufacturerData
            if (!manufacturerData) return

            // Check if manufacturerData is set
            const dataArray = Object.values(manufacturerData)
            if (!dataArray.length) return

            const data = dataArray[0]
            if (!data) return

            // Handle received data
            const weight = (data.getUint8(this.weightOffset) << 8) | data.getUint8(this.weightOffset + 1)
            const receivedTime: number = Date.now()
            const receivedData = weight / 100

            const numericData = receivedData - this.applyTare(receivedData) * -1

            // Add data to downloadable Array
            this.downloadPackets.push({
              received: receivedTime,
              sampleNum: this.dataPointCount,
              battRaw: 0,
              samples: [numericData],
              masses: [numericData],
            })

            // Update peak
            this.peak = Math.max(this.peak, numericData)

            // Update running sum and count
            const currentMassTotal = Math.max(-1000, numericData)
            this.sum += currentMassTotal
            this.dataPointCount++

            // Calculate the average dynamically
            this.mean = this.sum / this.dataPointCount

            // Check if device is being used
            this.activityCheck(numericData)

            // Notify with weight data
            this.notifyCallback(this.buildForceMeasurement(Math.max(-1000, numericData)))
          }
        },
      )
    } catch (error) {
      onError(error as Error)
    }
  }

  override download = async (format: "csv" | "json" | "xml" = "csv"): Promise<void> => {
    let content = ""

    if (format === "csv") {
      content = this.downloadToCSV()
    } else if (format === "json") {
      content = this.downloadToJSON()
    } else if (format === "xml") {
      content = this.downloadToXML()
    }

    const now = new Date()
    // YYYY-MM-DD
    const date = now.toISOString().split("T")[0]
    // HH-MM-SS
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")

    const fileName = `data-export-${date}-${time}.${format}`

    try {
      await Filesystem.writeFile({
        path: fileName,
        data: btoa(content),
        directory: Directory.Documents,
        recursive: true,
      })
      console.log(`File saved as ${fileName} in Documents directory`)
    } catch (error) {
      console.error("Error saving file:", error)
      throw error
    }
  }
}
