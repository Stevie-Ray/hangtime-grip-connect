import { Device } from "../device.model"
import type { IForceBoard } from "../../interfaces/device/forceboard.interface"
import { read } from "../../read"

/**
 * Represents a PitchSix Force Board device
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
          name: "",
          id: "",
          uuid: "3a90328c-c266-4c76-b05a-6af6104a0b13",
          characteristics: [
            {
              name: "Read",
              id: "",
              uuid: "3a90328d-c266-4c76-b05a-6af6104a0b13",
            },
          ],
        },
        {
          name: "",
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
          name: "",
          id: "",
          uuid: "467a8516-6e39-11eb-9439-0242ac130002",
          characteristics: [
            {
              name: "Read + Write",
              id: "",
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
    })
  }

  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information,
   */
  battery = async (): Promise<string | undefined> => {
    if (this.isConnected()) {
      return await read(this, "battery", "level", 250)
    }
    // If device is not found, return undefined
    return undefined
  }

  /**
   * Retrieves humidity level from the device.
   * @returns {Promise<string>} A Promise that resolves with the humidity level,
   */
  humidity = async (): Promise<string | undefined> => {
    // Check if the device is connected
    if (this.isConnected()) {
      return await read(this, "humidity", "level", 250)
    }
    // If device is not found, return undefined
    return undefined
  }

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string>} A Promise that resolves with the manufacturer information,
   */
  manufacturer = async (): Promise<string | undefined> => {
    // Check if the device is connected
    if (this.isConnected()) {
      // Read manufacturer information from the device
      return await read(this, "device", "manufacturer", 250)
    }
    // If device is not found, return undefined
    return undefined
  }
}