import { Device } from "../device.model.js"
import type { IClimbro } from "../../interfaces/device/climbro.interface.js"

/**
 * Climbro protocol constants
 */
enum ClimbroResponses {
  /**
   * 240 - Battery data marker
   */
  BAT_DAT = 0xf0,
  /**
   * 245 - Sensor data marker
   */
  SENS_DAT = 0xf5,
  /**
   * 246 - 36kg value
   */
  DAT_36KG = 0xf6,
}

/**
 * Represents a Climbro device.
 * {@link https://climbro.com/}
 */
export class Climbro extends Device implements IClimbro {
  /**
   * Battery constants
   */
  private static readonly minBatteryDisc: number = 112
  private static readonly maxBatteryDisc: number = 230
  private static readonly batRangeDisc: number = this.maxBatteryDisc - this.minBatteryDisc
  private static readonly batLevelCoef: number = 100 / this.batRangeDisc

  /**
   * Synchronization flag used to track the current data type being processed.
   * Set to BAT_DAT when processing battery data, SENS_DAT when processing sensor data.
   * @type {number}
   * @private
   */
  private flagSynchro = 0

  /**
   * Current battery level percentage calculated from the device's battery voltage.
   * @type {number}
   * @private
   */
  private batteryLevel = 0

  constructor() {
    super({
      filters: [{ namePrefix: "Climbro" }],
      services: [
        {
          name: "UART Transparent Service",
          id: "uart",
          uuid: "49535343-fe7d-4ae5-8fa9-9fafd205e455",
          characteristics: [
            {
              name: "UART Tramsmit (we set as rx)",
              id: "rx",
              uuid: "49535343-1e4d-4bd9-ba61-23c647249616",
            },
            {
              name: "UART Receive (we set as tx)",
              id: "tx",
              uuid: "49535343-8841-43f4-a8d4-ecbe34729bb3",
            },
            {
              name: "Transparent Control Point",
              id: "tcp",
              uuid: "49535343-4c8a-39b3-2f49-511cff073b7e",
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
              id: "model", // RN487x
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
              id: "hardware", // 5505 102_BLDK3
              uuid: "00002a27-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Software Revision String",
              id: "software", // 1.30
              uuid: "00002a28-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Manufacturer Name String",
              id: "manufacturer", // Microchip
              uuid: "00002a29-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "IEEE 11073-20601 Regulatory Certification Data List",
              id: "certification",
              uuid: "00002a2a-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
      ],
    })
  }

  /**
   * Retrieves battery level from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery level.
   */
  battery = async (): Promise<string | undefined> => {
    // Battery level is continuously updated via notifications
    return this.batteryLevel.toString()
  }

  /**
   * Retrieves hardware version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the hardware version.
   */
  hardware = async (): Promise<string | undefined> => {
    return await this.read("device", "hardware", 250)
  }

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the manufacturer information.
   */
  manufacturer = async (): Promise<string | undefined> => {
    return await this.read("device", "manufacturer", 250)
  }

  /**
   * Retrieves model number from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the model number.
   */
  model = async (): Promise<string | undefined> => {
    return await this.read("device", "model", 250)
  }

  /**
   * Retrieves software version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the software version.
   */
  software = async (): Promise<string | undefined> => {
    return await this.read("device", "software", 250)
  }

  /**
   * Retrieves system id from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the system id.
   */
  system = async (): Promise<string | undefined> => {
    return await this.read("device", "system", 250)
  }

  /**
   * Handles data received from the device, processes force measurements and battery data
   * according to the Climbro protocol.
   *
   * @param {DataView} value - The notification event.
   */
  override handleNotifications = (value: DataView): void => {
    if (value) {
      this.updateTimestamp()
      if (value.buffer) {
        const buffer = new Uint8Array(value.buffer)
        const byteCount = buffer.length

        let flagSynchro = this.flagSynchro
        let forceCount = 0
        for (let i = 0; i < byteCount; i++) {
          const b = buffer[i]
          if (b === ClimbroResponses.BAT_DAT) {
            flagSynchro = ClimbroResponses.BAT_DAT
            continue
          }
          if (b === ClimbroResponses.SENS_DAT) {
            flagSynchro = ClimbroResponses.SENS_DAT
            continue
          }
          if (b === ClimbroResponses.DAT_36KG) {
            // 36kg sentinel: fall through to sync/force handling
          }
          if (flagSynchro === ClimbroResponses.BAT_DAT) continue
          if (flagSynchro === ClimbroResponses.SENS_DAT) {
            forceCount++
          }
        }

        this.currentSamplesPerPacket = forceCount
        this.recordPacketReceived()
        const receivedTime: number = Date.now()

        for (let i = 0; i < byteCount; i++) {
          let signalValue = buffer[i]

          // Check for battery data marker
          if (signalValue === ClimbroResponses.BAT_DAT) {
            this.flagSynchro = ClimbroResponses.BAT_DAT
            continue
          }

          // Check for sensor data marker
          if (signalValue === ClimbroResponses.SENS_DAT) {
            this.flagSynchro = ClimbroResponses.SENS_DAT
            continue
          }

          // Check if signal is the reserved word for 36kg and convert it
          if (signalValue === ClimbroResponses.DAT_36KG) {
            signalValue = 36
          }

          // Process battery level signal
          if (this.flagSynchro === ClimbroResponses.BAT_DAT) {
            this.batteryLevel = Climbro.batLevelCoef * (signalValue - Climbro.minBatteryDisc)
            continue
          }

          // Process force signal
          if (this.flagSynchro === ClimbroResponses.SENS_DAT) {
            // Process force data inline
            const forceValue = signalValue
            const numericData = forceValue - this.applyTare(forceValue)
            const currentMassTotal = Math.max(-1000, Number(numericData))

            // Update session stats before building packet (so packet reflects this sample)
            this.peak = Math.max(this.peak, Number(numericData))
            this.min = Math.min(this.min, Math.max(-1000, Number(numericData)))
            this.sum += currentMassTotal
            this.dataPointCount++
            this.mean = this.sum / this.dataPointCount

            // Add data to downloadable array
            this.downloadPackets.push(
              this.buildDownloadPacket(currentMassTotal, [forceValue], {
                timestamp: receivedTime,
                battRaw: this.batteryLevel,
                sampleIndex: this.dataPointCount,
              }),
            )

            // Check if device is being used
            this.activityCheck(numericData)

            this.notifyCallback(this.buildForceMeasurement(currentMassTotal))

            continue
          }
        }
      }
    }
  }
}
