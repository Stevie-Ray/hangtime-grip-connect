import { Device } from "./devices/types"
import { notifyCallback } from "./notify"
import { handleMotherboardData } from "./devices/moterboard"

let server: BluetoothRemoteGATTServer
const receiveBuffer: number[] = []

/**
 * onDisconnected
 * @param board
 * @param event
 */
const onDisconnected = (event: Event, board: Device): void => {
  board.device = undefined
  const device = event.target as BluetoothDevice
  console.log(`Device ${device.name} is disconnected.`)
}
/**
 * handleNotifications
 * @param event
 * @param onNotify
 */
const handleNotifications = (event: Event, board: Device): void => {
  const characteristic = event.target as BluetoothRemoteGATTCharacteristic
  const value = characteristic.value
  if (value) {
    if (board.name === "Motherboard") {
      if (value) {
        for (let i = 0; i < value.byteLength; i++) {
          receiveBuffer.push(value.getUint8(i))
        }

        let idx: number
        while ((idx = receiveBuffer.indexOf(10)) >= 0) {
          const line = receiveBuffer.splice(0, idx + 1).slice(0, -1) // Combine and remove LF
          if (line.length > 0 && line[line.length - 1] === 13) line.pop() // Remove CR
          const decoder = new TextDecoder("utf-8")
          const receivedString = decoder.decode(new Uint8Array(line))
          handleMotherboardData(characteristic.uuid, receivedString)
        }
      }
    } else if (board.name === "ENTRALPI") {
      // TODO: handle Entralpi notify
      // characteristic.value!.getInt16(0) / 100;
      if (notifyCallback) {
        notifyCallback({ uuid: characteristic.uuid, value: value })
      }
    } else if (board.name === "Tindeq") {
      // TODO: handle Tindeq notify
    } else {
      if (notifyCallback) {
        notifyCallback({ uuid: characteristic.uuid, value: value })
      }
    }
  }
}
/**
 * onConnected
 * @param event
 * @param board
 */
const onConnected = async (board: Device, onSuccess: () => void): Promise<void> => {
  try {
    const services = await server?.getPrimaryServices()

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
                matchingCharacteristic.addEventListener("characteristicvaluechanged", (event) =>
                  handleNotifications(event, board),
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
 * Return all service UUIDs
 * @param device
 */
function getAllServiceUUIDs(device: Device) {
  return device.services.map((service) => service.uuid)
}
/**
 * Connect to the BluetoothDevice
 * @param device
 * @param onSuccess
 */
export const connect = async (board: Device, onSuccess: () => void): Promise<void> => {
  try {
    const deviceServices = getAllServiceUUIDs(board)

    // setup filter list
    const filters = []

    if (board.name) {
      filters.push({
        name: board.name,
      })
    }
    if (board.companyId) {
      filters.push({
        manufacturerData: [
          {
            companyIdentifier: board.companyId,
          },
        ],
      })
    }

    const device = await navigator.bluetooth.requestDevice({
      filters: filters,
      optionalServices: deviceServices,
    })

    board.device = device

    if (!board.device.gatt) {
      console.error("GATT is not available on this device")
      return
    }

    server = await board.device?.gatt?.connect()

    board.device.addEventListener("gattserverdisconnected", (event) => onDisconnected(event, board))

    if (server.connected) {
      await onConnected(board, onSuccess)
    }
  } catch (error) {
    console.error(error)
  }
}
