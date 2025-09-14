import { Device } from "../device.model.js"

/**
 * Represents a NSD PB-700BT device.
 * {@link https://www.nsd.com.tw/}
 */
export class PB700BT extends Device {
  constructor() {
    super({
      filters: [{ name: "NSD Workout" }],
      services: [
        {
          name: "Battery Service",
          id: "battery",
          uuid: "0000180f-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Battery Level",
              id: "level",
              uuid: "00002a19-0000-1000-8000-00805f9b34fb", // 100
            },
          ],
        },
        {
          name: "Custom Service", // Unknown custom service
          id: "custom",
          uuid: "0000feba-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Custom Characteristic 1", // Unknown characteristic
              id: "custom1",
              uuid: "0000fa10-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Custom Characteristic 2", // Unknown characteristic
              id: "custom2",
              uuid: "0000fa11-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Custom Characteristic 3", // Unknown characteristic
              id: "custom3",
              uuid: "0000fa13-0000-1000-8000-00805f9b34fb",
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
              name: "Unknown UART Characteristic", // Unknown UART characteristic
              id: "unknown1",
              uuid: "0000fff3-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "RX",
              id: "rx",
              uuid: "0000fff4-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Unknown UART Characteristic 2", // Unknown UART characteristic
              id: "unknown2",
              uuid: "0000fff6-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Unknown UART Characteristic 3", // Unknown UART characteristic
              id: "unknown3",
              uuid: "0000fff7-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Unknown UART Characteristic 4", // Unknown UART characteristic
              id: "unknown4",
              uuid: "0000fff8-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
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
              uuid: "00002a24-0000-1000-8000-00805f9b34fb", // MD8107
            },
            // {
            //   name: "Serial Number String (Blocked)",
            //   id: "serial",
            //   uuid: "00002a25-0000-1000-8000-00805f9b34fb",
            // },
            {
              name: "Firmware Revision String",
              id: "firmware",
              uuid: "00002a26-0000-1000-8000-00805f9b34fb", // 0.7
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
              uuid: "00002a29-0000-1000-8000-00805f9b34fb", // AMICCOM Elec.
            },
            {
              name: "PnP ID",
              id: "pnp",
              uuid: "00002a50-0000-1000-8000-00805f9b34fb",
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
   * @param {DataView} value - The notification event.
   */
  override handleNotifications = (value: DataView): void => {
    if (value) {
      // Update timestamp
      this.updateTimestamp()
      if (value.buffer) {
        const period = value.getUint32(0, false)

        if (!Number.isFinite(period) || period === 0) return

        const ts = value.getUint32(4, false)

        const rpmFloat = 60 * (666666 / period)

        // Accept only RPMs in plausible range (~800–15000)
        if (!Number.isFinite(rpmFloat) || rpmFloat < 800 || rpmFloat > 15000) return

        const receivedData = Math.round(rpmFloat)
        const receivedTime = Date.now()

        const numericData = receivedData - this.applyTare(receivedData)

        // Add data to downloadable Array
        this.downloadPackets.push({
          received: receivedTime,
          sampleNum: ts,
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
