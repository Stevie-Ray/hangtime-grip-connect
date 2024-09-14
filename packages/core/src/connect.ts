import type { Device } from "./types/devices"
import { handleEntralpiData, handleMotherboardData, handleProgressorData, handleWHC06Data } from "./data"
import { isEntralpi, isMotherboard, isProgressor } from "./is-device"

let server: BluetoothRemoteGATTServer
const receiveBuffer: number[] = []

/**
 * Handles the 'disconnected' event.
 * @param {Event} event - The 'disconnected' event.
 * @param {Device} board - The device that is disconnected.
 */
const onDisconnected = (event: Event, board: Device): void => {
  board.device = undefined
  const device = event.target as BluetoothDevice
  throw new Error(`Device ${device.name} is disconnected.`)
}
/**
 * Handles notifications received from a characteristic.
 * @param {Event} event - The notification event.
 * @param {Device} board - The device associated with the characteristic.
 */
const handleNotifications = (event: Event, board: Device): void => {
  const characteristic: BluetoothRemoteGATTCharacteristic = event.target as BluetoothRemoteGATTCharacteristic
  const value: DataView | undefined = characteristic.value

  if (value) {
    // If the device is connected and it is a Motherboard device
    if (isMotherboard(board)) {
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
    } else if (isEntralpi(board)) {
      if (value.buffer) {
        const buffer: ArrayBuffer = value.buffer
        const rawData: DataView = new DataView(buffer)
        const receivedData: string = (rawData.getUint16(0) / 100).toFixed(1)
        handleEntralpiData(receivedData)
      }
    } else if (isProgressor(board)) {
      if (value.buffer) {
        const buffer: ArrayBuffer = value.buffer
        const rawData: DataView = new DataView(buffer)
        handleProgressorData(rawData)
      }
    } else {
      console.log(value)
    }
  }
}
/**
 * Handles the 'connected' event.
 * @param {Device} board - The connected device.
 * @param {Function} onSuccess - Callback function to execute on successful connection.
 */
const onConnected = async (board: Device, onSuccess: () => void): Promise<void> => {
  // Connect to GATT server and set up characteristics
  const services: BluetoothRemoteGATTService[] = await server.getPrimaryServices()

  if (!services || services.length === 0) {
    throw new Error("No services found")
  }

  for (const service of services) {
    const matchingService = board.services.find((boardService) => boardService.uuid === service.uuid)

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
                handleNotifications(event, board)
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
const getAllServiceUUIDs = (device: Device) => {
  return device.services.map((service) => service.uuid)
}
/**
 * Connects to a Bluetooth device.
 * @param {Device} board - The device to connect to.
 * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
 * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
 */
export const connect = async (
  board: Device,
  onSuccess: () => void = () => console.log("Connected successfully"),
  onError: (error: Error) => void = (error) => console.error(error),
): Promise<void> => {
  try {
    // Request device and set up connection
    const deviceServices = getAllServiceUUIDs(board)

    // Only data matching the optionalManufacturerData parameter to requestDevice is included in the advertisement event: https://github.com/WebBluetoothCG/web-bluetooth/issues/598
    const optionalManufacturerData = board.filters.flatMap(
      (filter) => filter.manufacturerData?.map((data) => data.companyIdentifier) || [],
    )

    const device = await navigator.bluetooth.requestDevice({
      filters: board.filters,
      optionalServices: deviceServices,
      optionalManufacturerData,
    })

    board.device = device

    if (!board.device.gatt) {
      throw new Error("GATT is not available on this device")
    }

    board.device.addEventListener("gattserverdisconnected", (event) => {
      onDisconnected(event, board)
    })

    // WH-C06
    const MANUFACTURER_ID = 256 // 0x0100

    board.device.addEventListener("advertisementreceived", (event) => {
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
      if (typeof board.device.watchAdvertisements === "function") {
        await board.device.watchAdvertisements()
      } else {
        throw new Error(
          "watchAdvertisements isn't supported. For Chrome, enable it at chrome://flags/#enable-experimental-web-platform-features.",
        )
      }
    }

    server = await board.device.gatt.connect()

    if (server.connected) {
      await onConnected(board, onSuccess)
    }
  } catch (error) {
    onError(error as Error)
  }
}
