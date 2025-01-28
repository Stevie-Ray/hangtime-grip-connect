import { Device } from "../device.model.js"
import type { IEntralpi } from "../../interfaces/device/entralpi.interface.js"

/**
 * Represents a Entralpi device.
 * {@link https://entralpi.com}
 */
export class Entralpi extends Device implements IEntralpi {
  constructor() {
    super({
      filters: [
        {
          name: "ENTRALPI",
        },
      ],
      services: [
        {
          name: "Device Information",
          id: "device",
          uuid: "0000180a-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "System ID",
              id: "system",
              uuid: "00002a23-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Model Number String",
              id: "model",
              uuid: "00002a24-0000-1000-8000-00805f9b34fb",
            },
            // {
            //   name: "Serial Number String (Blocked)",
            //   id: "serial",
            //   uuid: "00002a25-0000-1000-8000-00805f9b34fb",
            // },
            {
              name: "Firmware Revision String",
              id: "firmware",
              uuid: "00002a26-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Hardware Revision String",
              id: "hardware",
              uuid: "00002a27-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Software Revision String",
              id: "software",
              uuid: "00002a28-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Manufacturer Name String",
              id: "manufacturer",
              uuid: "00002a29-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "IEEE 11073-20601 Regulatory Certification Data List",
              id: "certification",
              uuid: "00002a2a-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "PnP ID",
              id: "pnp",
              uuid: "00002a50-0000-1000-8000-00805f9b34fb",
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
          name: "Generic Attribute",
          id: "attribute",
          uuid: "f000ffc0-0451-4000-b000-000000000000",
          characteristics: [
            {
              name: "",
              id: "",
              uuid: "f000ffc1-0451-4000-b000-000000000000",
            },
            {
              name: "",
              id: "",
              uuid: "f000ffc2-0451-4000-b000-000000000000",
            },
          ],
        },
        {
          name: "UART ISSC Transparent Service",
          id: "uart",
          uuid: "0000fff0-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "TX",
              id: "tx",
              uuid: "0000fff1-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "RX",
              id: "rx",
              uuid: "0000fff4-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
        {
          name: "Weight Scale",
          id: "weight",
          uuid: "0000181d-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "notify",
              id: "rx",
              uuid: "0000fff1-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
      ],
    })
  }

  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information.
   */
  battery = async (): Promise<string | undefined> => {
    return await this.read("battery", "level", 250)
  }

  /**
   * Retrieves IEEE 11073-20601 Regulatory Certification from the device.
   * @returns {Promise<string>} A Promise that resolves with the certification.
   */
  certification = async (): Promise<string | undefined> => {
    return await this.read("device", "certification", 250)
  }

  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the firmware version.
   */
  firmware = async (): Promise<string | undefined> => {
    return await this.read("device", "firmware", 250)
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
        const receivedData: string = (value.getUint16(0) / 100).toFixed(1)

        const convertedData = Number(receivedData)
        // Adjust weight by using the tare value
        // If tare is 0, use the original weight, otherwise subtract tare and invert.
        // This will display the removed or 'no-hanging' weight.
        const tare = this.applyTare(convertedData)
        const numericData = tare === 0 ? convertedData : (convertedData - tare) * -1
        // Add data to downloadable Array
        this.downloadPackets.push({
          received: receivedTime,
          sampleNum: this.dataPointCount,
          battRaw: 0,
          samples: [convertedData],
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

  /**
   * Retrieves hardware version from the device.
   * @returns {Promise<string>} A Promise that resolves with the hardware version.
   */
  hardware = async (): Promise<string | undefined> => {
    return await this.read("device", "hardware", 250)
  }

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string>} A Promise that resolves with the manufacturer information.
   */
  manufacturer = async (): Promise<string | undefined> => {
    return await this.read("device", "manufacturer", 250)
  }

  /**
   * Retrieves model number from the device.
   * @returns {Promise<string>} A Promise that resolves with the model number.
   */
  model = async (): Promise<string | undefined> => {
    return await this.read("device", "model", 250)
  }

  /**
   * Retrieves PnP ID from the device, a set of values that used to create a device ID value that is unique for this device.
   * Included in the characteristic is a Vendor ID Source field, a Vendor ID field, a Product ID field and a Product Version field
   * @returns {Promise<string>} A Promise that resolves with the PnP ID.
   */
  pnp = async (): Promise<string | undefined> => {
    return await this.read("device", "pnp", 250)
  }

  /**
   * Retrieves software version from the device.
   * @returns {Promise<string>} A Promise that resolves with the software version.
   */
  software = async (): Promise<string | undefined> => {
    return await this.read("device", "software", 250)
  }

  /**
   * Retrieves system id from the device.
   * @returns {Promise<string>} A Promise that resolves with the system id.
   */
  system = async (): Promise<string | undefined> => {
    return await this.read("device", "system", 250)
  }
}
