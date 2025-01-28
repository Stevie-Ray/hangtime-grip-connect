import { Device } from "../device.model.js"
import type { IWHC06 } from "../../interfaces/device/wh-c06.interface.js"

/**
 * Represents a Weiheng - WH-C06 (or MAT Muscle Meter) device.
 * To use this device enable: `chrome://flags/#enable-experimental-web-platform-features`.
 * {@link https://googlechrome.github.io/samples/web-bluetooth/scan.html| Web Bluetooth}
 * {@link https://weihengmanufacturer.com}
 */
export class WHC06 extends Device implements IWHC06 {
  /**
   * Offset for the byte location in the manufacturer data to extract the weight.
   * @type {number}
   * @static
   * @readonly
   * @constant
   */
  private static readonly weightOffset: number = 10

  /**
   * Company identifier for WH-C06, also used by 'TomTom International BV': https://www.bluetooth.com/specifications/assigned-numbers/
   * @type {number}
   * @static
   * @readonly
   * @constant
   */
  private static readonly manufacturerId: number = 256

  /**
   * To track disconnection timeout.
   * @type {number|null}
   * @private
   */
  private advertisementTimeout: ReturnType<typeof setTimeout> | null = null

  /**
   * The limit in seconds when timeout is triggered
   * @type {number}
   * @private
   * @readonly
   */
  private readonly advertisementTimeoutTime: number = 10

  // /**
  //  * Offset for the byte location in the manufacturer data to determine weight stability.
  //  * @type {number}
  //  * @static
  //  * @readonly
  //  * @constant
  //  */
  // private static readonly stableOffset: number = 14
  constructor() {
    super({
      filters: [
        {
          // namePrefix: "IF_B7",
          manufacturerData: [
            {
              companyIdentifier: 0x0100, // 256
            },
          ],
        },
      ],
      services: [],
    })
  }

  /**
   * Connects to a Bluetooth device.
   * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
   * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
   */
  override connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      // Only data matching the optionalManufacturerData parameter to requestDevice is included in the advertisement event: https://github.com/WebBluetoothCG/web-bluetooth/issues/598
      const optionalManufacturerData = this.filters.flatMap(
        (filter) => filter.manufacturerData?.map((data) => data.companyIdentifier) || [],
      )

      const bluetooth = await this.getBluetooth()

      this.bluetooth = await bluetooth.requestDevice({
        filters: this.filters,
        optionalManufacturerData,
      })

      if (!this.bluetooth.gatt) {
        throw new Error("GATT is not available on this device")
      }
      // Update timestamp
      this.updateTimestamp()

      // Device has no services / characteristics, so we directly call onSuccess
      onSuccess()

      this.bluetooth.addEventListener("advertisementreceived", (event) => {
        const data = event.manufacturerData.get(WHC06.manufacturerId)
        if (data) {
          // Handle recieved data
          const weight = (data.getUint8(WHC06.weightOffset) << 8) | data.getUint8(WHC06.weightOffset + 1)
          // const stable = (data.getUint8(STABLE_OFFSET) & 0xf0) >> 4
          // const unit = data.getUint8(STABLE_OFFSET) & 0x0f
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
        // Reset "still advertising" counter
        this.resetAdvertisementTimeout()
      })

      // When the companyIdentifier is provided we want to get manufacturerData using watchAdvertisements.
      if (optionalManufacturerData.length) {
        // Receive events when the system receives an advertisement packet from a watched device.
        // To use this function in Chrome: chrome://flags/#enable-experimental-web-platform-features has to be enabled.
        // More info: https://chromestatus.com/feature/5180688812736512
        if (typeof this.bluetooth.watchAdvertisements === "function") {
          await this.bluetooth.watchAdvertisements()
        } else {
          throw new Error(
            "watchAdvertisements isn't supported. For Chrome, enable it at chrome://flags/#enable-experimental-web-platform-features.",
          )
        }
      }
    } catch (error) {
      onError(error as Error)
    }
  }

  /**
   * Custom check if a Bluetooth device is connected.
   * For the WH-C06 device, the `gatt.connected` property remains `false` even after the device is connected.
   * @returns {boolean} A boolean indicating whether the device is connected.
   */
  override isConnected = (): boolean => {
    return !!this.bluetooth
  }

  /**
   * Resets the timeout that checks if the device is still advertising.
   */
  private resetAdvertisementTimeout = (): void => {
    // Clear the previous timeout
    if (this.advertisementTimeout) {
      clearTimeout(this.advertisementTimeout)
    }

    // Set a new timeout to stop tracking if no advertisement is received
    this.advertisementTimeout = globalThis.setTimeout(() => {
      // Mimic a disconnect
      const disconnectedEvent = new Event("gattserverdisconnected")
      Object.defineProperty(disconnectedEvent, "target", {
        value: this.bluetooth,
        writable: false,
      })
      // Print error to the console
      console.error(`No advertisement received for ${this.advertisementTimeoutTime} seconds, stopping tracking..`)
      this.onDisconnected(disconnectedEvent)
    }, this.advertisementTimeoutTime * 1000) // 10 seconds
  }
}
