import { Device } from "./devices/types"
import { ProgressorCommands, ProgressorResponses } from "./commands/progressor"
import { notifyCallback } from "./notify"
import { handleMotherboardData } from "./data"
import { lastWrite } from "./write"

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
  const characteristic: BluetoothRemoteGATTCharacteristic = event.target as BluetoothRemoteGATTCharacteristic
  const value: DataView | undefined = characteristic.value

  function _unpackFloat(bytes: Uint8Array) {
    const view = new DataView(new ArrayBuffer(4))
    for (let i = 0; i < 4; i++) {
      view.setUint8(i, bytes[i])
    }
    return view.getFloat32(0, true)
  }

  // function _unpackInt(bytes: Uint8Array) {
  //   return (bytes[1] << 8) + bytes[0];
  // }

  if (value) {
    if (board.name === "Motherboard") {
      for (let i: number = 0; i < value.byteLength; i++) {
        receiveBuffer.push(value.getUint8(i))
      }

      let idx: number
      while ((idx = receiveBuffer.indexOf(10)) >= 0) {
        const line: number[] = receiveBuffer.splice(0, idx + 1).slice(0, -1) // Combine and remove LF
        if (line.length > 0 && line[line.length - 1] === 13) line.pop() // Remove CR
        const decoder: TextDecoder = new TextDecoder("utf-8")
        const receivedData: string = decoder.decode(new Uint8Array(line))
        handleMotherboardData(characteristic.uuid, receivedData)
      }
    } else if (board.name === "ENTRALPI") {
      if (value.buffer) {
        const buffer: ArrayBuffer = value.buffer
        const rawData: DataView = new DataView(buffer)
        const receivedData: number = rawData.getUint16(0) / 100
        if (notifyCallback) {
          notifyCallback({
            uuid: characteristic.uuid,
            value: {
              massTotal: receivedData,
            },
          })
        }
      }
    } else if (board.name && board.name.startsWith("Progressor")) {
      if (value.buffer) {
        const buffer: ArrayBuffer = value.buffer
        const rawData: Uint8Array = new Uint8Array(buffer)
        const kind: number = rawData[0]
        const tare: number = 0 // todo: add tare
        if (kind === ProgressorResponses.WEIGHT_MEASURE) {
          for (let i = 2; i < rawData.length; i += 6) {
            const weight = _unpackFloat(rawData.slice(i, i + 4))
            // let useconds = _unpackInt(rawData.slice(i + 4, i + 6));
            // let now = useconds / 1.0e6;

            if (notifyCallback) {
              notifyCallback({
                uuid: characteristic.uuid,
                value: {
                  massTotal: weight - tare,
                },
              })
            }
          }
        } else if (kind === ProgressorResponses.COMMAND_RESPONSE) {
          if (!lastWrite) return

          let value: string = ""

          if (lastWrite === ProgressorCommands.GET_BATT_VLTG) {
            const vdd = new DataView(rawData.buffer, 2).getUint32(0, true)
            value = `Battery level = ${vdd} [mV]`
          } else if (lastWrite === ProgressorCommands.GET_FW_VERSION) {
            value = new TextDecoder().decode(rawData.slice(2))
          } else if (lastWrite === ProgressorCommands.GET_ERR_INFO) {
            value = new TextDecoder().decode(rawData.slice(2))
          }
          if (notifyCallback) {
            notifyCallback({ uuid: characteristic.uuid, value: value })
          }
        } else if (kind === ProgressorResponses.LOW_BATTERY_WARNING) {
          if (notifyCallback) {
            notifyCallback({ uuid: characteristic.uuid, value: "low power warning" })
          }
        } else {
          if (notifyCallback) {
            notifyCallback({ uuid: characteristic.uuid, value: `unknown message kind ${kind}` })
          }
        }
      }
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
    const services: BluetoothRemoteGATTService[] = await server?.getPrimaryServices()

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
const getAllServiceUUIDs = (device: Device) => {
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
      const filterName = board.name === "Progressor" ? { namePrefix: board.name } : { name: board.name }
      filters.push(filterName)
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
