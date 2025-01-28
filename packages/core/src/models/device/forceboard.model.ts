import { Device } from "../device.model.js"
import type { IForceBoard } from "../../interfaces/device/forceboard.interface.js"

/**
 * Represents a PitchSix Force Board device.
 * {@link https://pitchsix.com}
 */
export class ForceBoard extends Device implements IForceBoard {
  constructor() {
    super({
      filters: [{ name: "Force Board" }],
      services: [
        {
          name: "Device Information",
          id: "device",
          uuid: "0000180a-0000-1000-8000-00805f9b34fb",
          characteristics: [
            // {
            //   name: "Serial Number String (Blocked)",
            //   id: "serial",
            //   uuid: "00002a25-0000-1000-8000-00805f9b34fb",
            // },
            // {
            //   name: "Firmware Revision String (Blocked)",
            //   id: "firmware",
            //   uuid: "00002a26-0000-1000-8000-00805f9b34f",
            // },
            {
              name: "Manufacturer Name String",
              id: "manufacturer",
              uuid: "00002a29-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
        {
          name: "Battery Service",
          id: "battery",
          uuid: "0000180f-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Battery Level",
              id: "level",
              uuid: "00002a19-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
        {
          name: "Nordic Device Firmware Update (DFU) Service",
          id: "dfu",
          uuid: "0000fe59-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Buttonless DFU",
              id: "dfu",
              uuid: "8ec90003-f315-4f60-9fb8-838830daea50",
            },
          ],
        },
        {
          name: "",
          id: "",
          uuid: "f3641400-00b0-4240-ba50-05ca45bf8abc",
          characteristics: [
            {
              name: "Read + Indicate",
              id: "",
              uuid: "f3641401-00b0-4240-ba50-05ca45bf8abc",
            },
          ],
        },
        {
          name: "Humidity Service",
          id: "humidity",
          uuid: "cf194c6f-d0c1-47b2-aeff-dc610f09bd18",
          characteristics: [
            {
              name: "Humidity Level",
              id: "level",
              uuid: "cf194c70-d0c1-47b2-aeff-dc610f09bd18",
            },
          ],
        },
        {
          name: "Temperature Serivce",
          id: "temperature",
          uuid: "3a90328c-c266-4c76-b05a-6af6104a0b13",
          characteristics: [
            {
              name: "Read",
              id: "level",
              uuid: "3a90328d-c266-4c76-b05a-6af6104a0b13",
            },
          ],
        },
        {
          name: "Forceboard Service",
          id: "forceboard",
          uuid: "9a88d67f-8df2-4afe-9e0d-c2bbbe773dd0",
          characteristics: [
            {
              name: "Write",
              id: "",
              uuid: "9a88d680-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Read + Indicate",
              id: "",
              uuid: "9a88d681-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Read + Notify",
              id: "rx",
              uuid: "9a88d682-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Write",
              id: "",
              uuid: "9a88d683-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Read",
              id: "",
              uuid: "9a88d685-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Write",
              id: "",
              uuid: "9a88d686-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Read + Write",
              id: "",
              uuid: "9a88d687-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Serial / Read + Write",
              id: "",
              uuid: "9a88d688-8df2-4afe-9e0d-c2bbbe773dd0",
            },
            {
              name: "Read + Write",
              id: "",
              uuid: "9a88d689-8df2-4afe-9e0d-c2bbbe773dd0",
            },
          ],
        },
        {
          name: "Weight Serivce",
          id: "weight",
          uuid: "467a8516-6e39-11eb-9439-0242ac130002",
          characteristics: [
            {
              name: "Read + Write",
              id: "tx",
              uuid: "467a8517-6e39-11eb-9439-0242ac130002",
            },
            {
              name: "Read + Write",
              id: "",
              uuid: "467a8518-6e39-11eb-9439-0242ac130002",
            },
          ],
        },
      ],
      commands: {
        STOP_WEIGHT_MEAS: "",
      },
    })
  }

  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  battery = async (): Promise<string | undefined> => {
    return await this.read("battery", "level", 250)
  }

  /**
   * Handles data received from the device, processes weight measurements,
   * and updates mass data including maximum and average values.
   * It also handles command responses for retrieving device information.
   *
   * @param {BluetoothRemoteGATTCharacteristic} characteristic - The notification event.
   */
  override handleNotifications = (characteristic: BluetoothRemoteGATTCharacteristic): void => {
    const value: DataView | undefined = characteristic.value
    if (value) {
      // Update timestamp
      this.updateTimestamp()
      if (value.buffer) {
        const receivedTime: number = Date.now()
        const dataArray = new Uint8Array(value.buffer)
        // Skip the first 2 bytes, which are the command and length
        // The data is sent in groups of 3 bytes
        for (let i = 2; i < dataArray.length; i += 3) {
          const receivedData = (dataArray[i] << 16) | (dataArray[i + 1] << 8) | dataArray[i + 2]
          // Convert from LBS to KG
          const convertedReceivedData = receivedData * 0.453592
          // Tare correction
          const numericData = convertedReceivedData - this.applyTare(convertedReceivedData)
          // Add data to downloadable Array
          this.downloadPackets.push({
            received: receivedTime,
            sampleNum: this.dataPointCount,
            battRaw: 0,
            samples: [convertedReceivedData],
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
      }
    }
  }

  /**
   * Retrieves humidity level from the device.
   * @returns {Promise<string>} A Promise that resolves with the humidity level,
   */
  humidity = async (): Promise<string | undefined> => {
    return await this.read("humidity", "level", 250)
  }

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string>} A Promise that resolves with the manufacturer information,
   */
  manufacturer = async (): Promise<string | undefined> => {
    return await this.read("device", "manufacturer", 250)
  }

  /**
   * Stops the data stream on the specified device.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop = async (): Promise<void> => {
    await this.write("weight", "tx", this.commands.STOP_WEIGHT_MEAS, 0)
  }

  /**
   * Starts streaming data from the specified device.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream = async (duration = 0): Promise<void> => {
    // Reset download packets
    this.downloadPackets.length = 0
    // Start streaming data
    await this.write("weight", "tx", new Uint8Array([0x04]), duration) // ASCII control character EOT (End of Transmission)
    // Stop streaming if duration is set
    if (duration !== 0) {
      await this.stop()
    }
  }

  /**
   * Retrieves temperature information from the device.
   * @returns {Promise<string>} A Promise that resolves with the manufacturer information,
   */
  temperature = async (): Promise<string | undefined> => {
    return await this.read("temperature", "level", 250)
  }
}
