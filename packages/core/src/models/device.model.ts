import { BaseModel } from "./../models/base.model"
import type { IDevice, Service } from "../interfaces/device.interface"
import { handleEntralpiData, handleMotherboardData, handleProgressorData, handleWHC06Data } from "./../data"
import { isEntralpi, isForceBoard, isMotherboard, isProgressor } from "./../is-device"

let server: BluetoothRemoteGATTServer

const receiveBuffer: number[] = []

export class Device extends BaseModel implements IDevice {
  filters: BluetoothLEScanFilter[]
  services: Service[]
  bluetooth?: BluetoothDevice | undefined

  constructor(device: IDevice) {
    super(device)

    this.filters = device.filters
    this.services = device.services
    this.bluetooth = device.bluetooth
  }
  /**
   * Handles the 'disconnected' event.
   * @param {Event} event - The 'disconnected' event.
   * @param {Device} board - The device that is disconnected.
   */
  onDisconnected = (event: Event): void => {
    this.bluetooth = undefined
    const device = event.target as BluetoothDevice
    throw new Error(`Device ${device.name} is disconnected.`)
  }
  /**
   * Handles notifications received from a characteristic.
   * @param {Event} event - The notification event.
   * @param {Device} board - The device associated with the characteristic.
   */
  handleNotifications = (event: Event): void => {
    const characteristic: BluetoothRemoteGATTCharacteristic = event.target as BluetoothRemoteGATTCharacteristic
    const value: DataView | undefined = characteristic.value

    if (value) {
      // If the device is connected and it is a Motherboard device
      if (isMotherboard(this)) {
        for (let i = 0; i < value.byteLength; i++) {
          receiveBuffer.push(value.getUint8(i))
        }

        let idx: number
        while ((idx = receiveBuffer.indexOf(10)) >= 0) {
          const line: number[] = receiveBuffer.splice(0, idx + 1).slice(0, -1) // Combine and remove LF
          if (line.length > 0 && line[line.length - 1] === 13) line.pop() // Remove CR
          const decoder: TextDecoder = new TextDecoder("utf-8")
          const receivedData: string = decoder.decode(new Uint8Array(line))
          handleMotherboardData(receivedData)
        }
      } else if (isEntralpi(this)) {
        if (value.buffer) {
          const buffer: ArrayBuffer = value.buffer
          const rawData: DataView = new DataView(buffer)
          const receivedData: string = (rawData.getUint16(0) / 100).toFixed(1)
          handleEntralpiData(receivedData)
        }
      } else if (isProgressor(this)) {
        if (value.buffer) {
          const buffer: ArrayBuffer = value.buffer
          const rawData: DataView = new DataView(buffer)
          handleProgressorData(rawData)
        }
      } else if (isForceBoard(this)) {
        if (value.buffer) {
          const buffer: ArrayBuffer = value.buffer
          console.log(new Uint8Array(buffer))
          const rawData: DataView = new DataView(buffer)
          console.log(rawData)
        }
      } else {
        console.log(value)
      }
    }
  }
  /**
   * Handles the 'connected' event.
   * @param {Function} onSuccess - Callback function to execute on successful connection.
   */
  onConnected = async (onSuccess: () => void): Promise<void> => {
    // Connect to GATT server and set up characteristics
    const services: BluetoothRemoteGATTService[] = await server.getPrimaryServices()

    if (!services || services.length === 0) {
      throw new Error("No services found")
    }

    for (const service of services) {
      const matchingService = this.services.find((boardService) => boardService.uuid === service.uuid)

      if (matchingService) {
        // Android bug: Introduce a delay before getting characteristics
        await new Promise((resolve) => setTimeout(resolve, 100))

        const characteristics = await service.getCharacteristics()

        for (const characteristic of matchingService.characteristics) {
          const matchingCharacteristic = characteristics.find((char) => char.uuid === characteristic.uuid)

          if (matchingCharacteristic) {
            const element = matchingService.characteristics.find((char) => char.uuid === matchingCharacteristic.uuid)
            if (element) {
              element.characteristic = matchingCharacteristic

              // notify
              if (element.id === "rx") {
                matchingCharacteristic.startNotifications()
                matchingCharacteristic.addEventListener("characteristicvaluechanged", (event: Event) => {
                  this.handleNotifications(event)
                })
              }
            }
          } else {
            throw new Error(`Characteristic ${characteristic.uuid} not found in service ${service.uuid}`)
          }
        }
      }
    }

    // Call the onSuccess callback after successful connection and setup
    onSuccess()
  }
  /**
   * Returns UUIDs of all services associated with the device.
   * @param {Device} device - The device.
   * @returns {string[]} Array of service UUIDs.
   */
  getAllServiceUUIDs = () => {
    return this.services.map((service) => service.uuid)
  }

  /**
   * Connects to a Bluetooth device.
   * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
   * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
   */
  connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      // Request device and set up connection
      const deviceServices = this.getAllServiceUUIDs()

      // Only data matching the optionalManufacturerData parameter to requestDevice is included in the advertisement event: https://github.com/WebBluetoothCG/web-bluetooth/issues/598
      const optionalManufacturerData = this.filters.flatMap(
        (filter) => filter.manufacturerData?.map((data) => data.companyIdentifier) || [],
      )

      this.bluetooth = await navigator.bluetooth.requestDevice({
        filters: this.filters,
        optionalServices: deviceServices,
        optionalManufacturerData,
      })

      if (!this.bluetooth.gatt) {
        throw new Error("GATT is not available on this device")
      }

      this.bluetooth.addEventListener("gattserverdisconnected", (event) => {
        this.onDisconnected(event)
      })

      // WH-C06
      const MANUFACTURER_ID = 256 // 0x0100

      this.bluetooth.addEventListener("advertisementreceived", (event) => {
        const manufacturerData = event.manufacturerData.get(MANUFACTURER_ID)
        if (manufacturerData) {
          // Device has no services / characteristics
          onSuccess()
          // Handle recieved data
          handleWHC06Data(manufacturerData)
        }
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

      server = await this.bluetooth.gatt.connect()

      if (server.connected) {
        await this.onConnected(onSuccess)
      }
    } catch (error) {
      onError(error as Error)
    }
  }
  /**
   * Checks if a Bluetooth device is connected.
   * @returns {boolean} A boolean indicating whether the device is connected.
   */
  isConnected = (): boolean => {
    // Check if the device is defined and available
    if (!this?.bluetooth) {
      return false
    }
    // Check if the device is connected
    return !!this.bluetooth.gatt?.connected
  }
  /**
   * Disconnects the device if it is currently connected.
   * - Checks if the device is connected via its GATT server.
   * - If the device is connected, it attempts to gracefully disconnect.
   */
  disconnect = (): void => {
    // Verify that the device is connected using the provided helper function
    if (this.isConnected()) {
      // Safely attempt to disconnect the device's GATT server, if available
      this.bluetooth?.gatt?.disconnect()
    }
  }
}
