import { Device } from "../device.model.js"
import type { ICTS500 } from "../../interfaces/device/cts500.interface.js"

/**
 * Represents the CTS500 Climbing Training Scale, marketed as "Jlyscales CTS500".
 * Supplier: Hunan Jinlian Cloud Information Technology Co., Ltd.
 * {@link https://www.huaying-scales.com/}
 * {@link https://www.alibaba.com/product-detail/Mini-Climbing-Training-Scale-CTS500-Aluminum_1601637814595.html}
 */
export class CTS500 extends Device implements ICTS500 {
  constructor() {
    super({
      filters: [{ name: "CTS-300" }],
      services: [
        {
          name: "Device Information",
          id: "device",
          uuid: "0000180a-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Model Number String",
              id: "model",
              uuid: "00002a24-0000-1000-8000-00805f9b34fb", // MY-BT102 https://www.muyusmart.cn/product/my-bt102/
            },
            // {
            //   name: "Serial Number String (Blocked)",
            //   id: "serial",
            //   uuid: "00002a25-0000-1000-8000-00805f9b34fb",
            // },
            {
              name: "Firmware Revision String",
              id: "firmware",
              uuid: "00002a26-0000-1000-8000-00805f9b34fb", // 109a
            },
            {
              name: "Hardware Revision String",
              id: "hardware",
              uuid: "00002a27-0000-1000-8000-00805f9b34fb", //1.0
            },
            {
              name: "Software Revision String",
              id: "software",
              uuid: "00002a28-0000-1000-8000-00805f9b34fb", // 2.1.3
            },
            {
              name: "Manufacturer Name String",
              id: "manufacturer",
              uuid: "00002a29-0000-1000-8000-00805f9b34fb", // DX
            },
          ],
        },
        {
          name: "CTS500 Service",
          id: "cts500",
          uuid: "0000ffe0-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Notify",
              id: "rx",
              uuid: "0000ffe1-0000-1000-8000-00805f9b34fb",
            },
            {
              name: "Write",
              id: "tx",
              uuid: "0000ffe2-0000-1000-8000-00805f9b34fb",
            },
          ],
        },
      ],
    })
  }

  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the firmware version.
   */
  firmware = async (): Promise<string | undefined> => {
    return await this.read("device", "firmware", 250)
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
   * Retrieves serial number from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the serial number.
   */
  serial = async (): Promise<string | undefined> => {
    return await this.read("device", "serial", 250)
  }

  /**
   * Retrieves software version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the software version.
   */
  software = async (): Promise<string | undefined> => {
    return await this.read("device", "software", 250)
  }
}
