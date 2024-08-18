import type { Device } from "./types/devices"
import { handleEntralpiData, handleMotherboardData, handleProgressorData } from "./data"

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
  console.log(`Device ${device.name} is disconnected.`)
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
    if (board.filters.some((filter) => filter.name === "Motherboard")) {
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
    } else if (board.filters.some((filter) => filter.name === "ENTRALPI")) {
      if (value.buffer) {
        const buffer: ArrayBuffer = value.buffer
        const rawData: DataView = new DataView(buffer)
        const receivedData: string = (rawData.getUint16(0) / 100).toFixed(1)
        handleEntralpiData(receivedData)
      }
    } else if (board.filters.some((filter) => filter.namePrefix === "Progressor")) {
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
  try {
    // Connect to GATT server and set up characteristics
    const services: BluetoothRemoteGATTService[] = await server.getPrimaryServices()

    if (!services || services.length === 0) {
      console.error("No services found")
      return
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
                matchingCharacteristic.addEventListener("characteristicvaluechanged", (event: Event) =>
                  { handleNotifications(event, board); },
                )
              }
            }
          } else {
            console.warn(`Characteristic ${characteristic.uuid} not found in service ${service.uuid}`)
          }
        }
      }
    }

    // Call the onSuccess callback after successful connection and setup
    onSuccess()
  } catch (error) {
    console.error(error)
  }
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
 * @param {Function} onSuccess - Callback function to execute on successful connection.
 */
export const connect = async (board: Device, onSuccess: () => void): Promise<void> => {
  try {
    // Request device and set up connection
    const deviceServices = getAllServiceUUIDs(board)

    const device = await navigator.bluetooth.requestDevice({
      filters: board.filters,
      optionalServices: deviceServices,
    })

    board.device = device

    if (!board.device.gatt) {
      console.error("GATT is not available on this device")
      return
    }

    server = await board.device.gatt.connect()

    board.device.addEventListener("gattserverdisconnected", (event) => { onDisconnected(event, board); })

    if (server.connected) {
      await onConnected(board, onSuccess)
    }
  } catch (error) {
    console.error(error)
  }
}
