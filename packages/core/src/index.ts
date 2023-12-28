interface Motherboard {
  device?: BluetoothDevice
  devSn?: BluetoothRemoteGATTCharacteristic
  devFr?: BluetoothRemoteGATTCharacteristic
  devHr?: BluetoothRemoteGATTCharacteristic
  devMn?: BluetoothRemoteGATTCharacteristic
  bat?: BluetoothRemoteGATTCharacteristic
  led01?: BluetoothRemoteGATTCharacteristic
  led02?: BluetoothRemoteGATTCharacteristic
  uartTx?: BluetoothRemoteGATTCharacteristic
  uartRx?: BluetoothRemoteGATTCharacteristic
}
// Device service
const DEVICE_SERVICE_UUID: string = "0000180a-0000-1000-8000-00805f9b34fb"
const DEVICE_SN_CHARACTERISTIC_UUID: string = "00002a25-0000-1000-8000-00805f9b34fb"
const DEVICE_FR_CHARACTERISTIC_UUID: string = "00002a26-0000-1000-8000-00805f9b34fb"
const DEVICE_HR_CHARACTERISTIC_UUID: string = "00002a27-0000-1000-8000-00805f9b34fb"
const DEVICE_MN_CHARACTERISTIC_UUID: string = "00002a29-0000-1000-8000-00805f9b34fb"
// Battery service (Read / Notify)
const BATTERY_SERVICE_UUID: string = "0000180f-0000-1000-8000-00805f9b34fb"
const BATTERY_CHARACTERISTIC_UUID: string = "00002a19-0000-1000-8000-00805f9b34fb"
// Led service
const LED_SERVICE_UUID: string = "10ababcd-15e1-28ff-de13-725bea03b127"
const LED_01_CHARACTERISTIC_UUID: string = "10ab1524-15e1-28ff-de13-725bea03b127"
const LED_02_CHARACTERISTIC_UUID: string = "10ab1525-15e1-28ff-de13-725bea03b127"
// An implementation of Nordic Semicondutor's UART/Serial Port Emulation over Bluetooth low energy
const UART_SERVICE_UUID: string = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
const UART_TX_CHARACTERISTIC_UUID: string = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
const UART_RX_CHARACTERISTIC_UUID: string = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"

const motherboard: Motherboard = {}
/**
 * disconnect
 */
const disconnect = (): void => {
  if (!motherboard.device) return
  if (motherboard.device.gatt?.connected) {
    motherboard.device.gatt?.disconnect()
  }
}
/**
 * onDisconnected
 * @param event
 */
const onDisconnected = (event: Event): void => {
  motherboard.device = undefined
  const device = event.target as BluetoothDevice
  console.log(`Device ${device.name} is disconnected.`)
}
/**
 * handleNotifications
 * @param event
 */
const handleNotifications = (event: Event): void => {
  const characteristic = event.target as BluetoothRemoteGATTCharacteristic
  const receivedData = new Uint8Array(characteristic.value!.buffer)

  // Create an array to store the parsed decimal values
  const decimalArray: number[] = []

  // Iterate through each byte and convert to decimal
  for (let i = 0; i < receivedData.length; i++) {
    decimalArray.push(receivedData[i])
  }
  // Convert the decimal array to a string representation
  const receivedString: string = String.fromCharCode(...decimalArray)

  // Split the string into pairs of characters
  const hexPairs: RegExpMatchArray | null = receivedString.match(/.{1,2}/g)

  // Convert each hexadecimal pair to decimal
  const parsedDecimalArray: number[] | undefined = hexPairs?.map((hexPair) => parseInt(hexPair, 16))

  // Handle different types of data
  if (characteristic.value!.byteLength === 20) {
    // Define keys for the elements
    const elementKeys = [
      "frames",
      "cycle",
      "unknown",
      "eleven",
      "trippin1",
      "pressure1",
      "left",
      "trippin2",
      "pressure2",
      "right",
    ]
    // Create a single object with keys and values
    const dataObject = {}

    if (parsedDecimalArray) {
      elementKeys.forEach((key, index) => {
        dataObject[key] = parsedDecimalArray[index]
      })
    }
    // Print the formatted string on the screen
    console.log(dataObject)
  } else if (characteristic.value!.byteLength === 14) {
    console.log(characteristic.value!.byteLength, parsedDecimalArray)
  } else {
    console.log(characteristic.value!.byteLength, parsedDecimalArray)
  }
}
/**
 * getCharacteristic
 * @param service
 * @param uuid
 * @returns Promise<void>
 */
/**
 * getCharacteristic
 * @param service
 * @param uuid
 * @returns Promise<void>
 */
const getCharacteristic = (service: BluetoothRemoteGATTService, uuid: string): Promise<void> => {
  return new Promise<void>((resolve, reject) => {
    service
      .getCharacteristic(uuid)
      .then((characteristic) => {
        switch (characteristic.uuid) {
          case DEVICE_SN_CHARACTERISTIC_UUID:
            motherboard.devSn = characteristic
            break
          case DEVICE_FR_CHARACTERISTIC_UUID:
            motherboard.devFr = characteristic
            break
          case DEVICE_HR_CHARACTERISTIC_UUID:
            motherboard.devHr = characteristic
            break
          case DEVICE_MN_CHARACTERISTIC_UUID:
            motherboard.devMn = characteristic
            break
          case BATTERY_CHARACTERISTIC_UUID:
            motherboard.bat = characteristic
            break
          case LED_01_CHARACTERISTIC_UUID:
            motherboard.led01 = characteristic
            break
          case LED_02_CHARACTERISTIC_UUID:
            motherboard.led02 = characteristic
            break
          case UART_TX_CHARACTERISTIC_UUID:
            motherboard.uartTx = characteristic
            break
          case UART_RX_CHARACTERISTIC_UUID:
            motherboard.uartRx = characteristic
            motherboard.uartRx.startNotifications()
            motherboard.uartRx.addEventListener("characteristicvaluechanged", handleNotifications)
            break
          default:
            break
        }
        resolve() // Resolve the Promise after characteristic assignment
      })
      .catch((error) => {
        reject(error) // Reject the Promise on error
      })
  })
}

/**
 * connect
 * @param onSuccess
 */
const connect = async (onSuccess: () => void): Promise<void> => {
  try {
    const device = await navigator.bluetooth.requestDevice({
      filters: [
        {
          name: "Motherboard",
        },
        {
          manufacturerData: [
            {
              companyIdentifier: 0x2a29,
            },
          ],
        },
      ],
      optionalServices: [DEVICE_SERVICE_UUID, BATTERY_SERVICE_UUID, UART_SERVICE_UUID, LED_SERVICE_UUID],
    })

    motherboard.device = device
    device.addEventListener("gattserverdisconnected", onDisconnected)

    const server = await device.gatt?.connect()
    const services = await server?.getPrimaryServices()

    if (services === null) {
      console.error("getPrimaryServices is 'null'")
      return
    }
    if (services?.length) {
      for (const service of services) {
        switch (service.uuid) {
          case DEVICE_SERVICE_UUID:
            await Promise.all([
              getCharacteristic(service, DEVICE_FR_CHARACTERISTIC_UUID),
              getCharacteristic(service, DEVICE_HR_CHARACTERISTIC_UUID),
              getCharacteristic(service, DEVICE_MN_CHARACTERISTIC_UUID),
            ])
            break
          case BATTERY_SERVICE_UUID:
            await getCharacteristic(service, BATTERY_CHARACTERISTIC_UUID)
            break
          case LED_SERVICE_UUID:
            await Promise.all([
              getCharacteristic(service, LED_01_CHARACTERISTIC_UUID),
              getCharacteristic(service, LED_02_CHARACTERISTIC_UUID),
            ])
            break
          case UART_SERVICE_UUID:
            await Promise.all([
              getCharacteristic(service, UART_TX_CHARACTERISTIC_UUID),
              getCharacteristic(service, UART_RX_CHARACTERISTIC_UUID),
            ])
            break
          default:
            break
        }
      }
      onSuccess()
    }
  } catch (error) {
    console.error(error)
  }
}
/**
 * read
 * @param characteristic
 */
const read = (characteristic: BluetoothRemoteGATTCharacteristic | undefined): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (motherboard.device?.gatt?.connected) {
      if (characteristic) {
        characteristic
          .readValue()
          .then((value) => {
            switch (characteristic.uuid) {
              case BATTERY_CHARACTERISTIC_UUID:
                console.log(characteristic.uuid, value.getUint8(0))
                break
              default:
                // eslint-disable-next-line no-case-declarations
                const decoder = new TextDecoder("utf-8")
                console.log(characteristic.uuid, decoder.decode(value))
                break
            }
            resolve()
          })
          .catch((error) => {
            reject(error)
          })
      } else {
        reject(new Error("Characteristics is undefined"))
      }
    } else {
      reject(new Error("Device is not connected"))
    }
  })
}
/**
 * write
 * @param characteristic
 * @param message
 */
const write = (
  characteristic: BluetoothRemoteGATTCharacteristic | undefined,
  message: string,
  duration: number = 0,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (motherboard.device?.gatt?.connected) {
      const encoder = new TextEncoder()
      if (characteristic) {
        console.log(characteristic.uuid, message)
        characteristic
          .writeValue(encoder.encode(message))
          .then(() => {
            setTimeout(() => {
              resolve()
            }, duration)
          })
          .catch((error) => {
            reject(error)
          })
      } else {
        reject(new Error("Characteristics is undefined"))
      }
    } else {
      reject(new Error("Device is not connected"))
    }
  })
}

export default motherboard

export { disconnect, connect, read, write }
