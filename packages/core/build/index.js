// Device service
const DEVICE_SERVICE_UUID = "0000180a-0000-1000-8000-00805f9b34fb"
const DEVICE_SN_CHARACTERISTIC_UUID = "00002a25-0000-1000-8000-00805f9b34fb"
const DEVICE_FR_CHARACTERISTIC_UUID = "00002a26-0000-1000-8000-00805f9b34fb"
const DEVICE_HR_CHARACTERISTIC_UUID = "00002a27-0000-1000-8000-00805f9b34fb"
const DEVICE_MN_CHARACTERISTIC_UUID = "00002a29-0000-1000-8000-00805f9b34fb"
// Battery service (Read / Notify)
const BATTERY_SERVICE_UUID = "0000180f-0000-1000-8000-00805f9b34fb"
const BATTERY_CHARACTERISTIC_UUID = "00002a19-0000-1000-8000-00805f9b34fb"
// Led service
const LED_SERVICE_UUID = "10ababcd-15e1-28ff-de13-725bea03b127"
const LED_01_CHARACTERISTIC_UUID = "10ab1524-15e1-28ff-de13-725bea03b127"
const LED_02_CHARACTERISTIC_UUID = "10ab1525-15e1-28ff-de13-725bea03b127"
// An implementation of Nordic Semicondutor's UART/Serial Port Emulation over Bluetooth low energy
const UART_SERVICE_UUID = "6e400001-b5a3-f393-e0a9-e50e24dcca9e"
const UART_TX_CHARACTERISTIC_UUID = "6e400002-b5a3-f393-e0a9-e50e24dcca9e"
const UART_RX_CHARACTERISTIC_UUID = "6e400003-b5a3-f393-e0a9-e50e24dcca9e"
// https://github.com/sepp89117/GoPro_Web_RC/blob/main/GoPro_Web_RC.html
const motherboard = {}
const connect = () => {
  navigator.bluetooth
    .requestDevice({
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
    .then(async (device) => {
      motherboard.device = device
      device.addEventListener("gattserverdisconnected", onDisconnected)
      return device.gatt?.connect()
    })
    .then((server) => {
      return server?.getPrimaryServices()
    })
    .then((services) => {
      // console.log(services)
      if (services === null) {
        console.error("getPrimaryServices is 'null'")
      } else {
        if (services) {
          for (const service of services) {
            switch (service.uuid) {
              case DEVICE_SERVICE_UUID:
                // getCharacteristic(service, DEVICE_SN_CHARACTERISTIC_UUID) getCharacteristic(s) called with blocklisted UUID
                getCharacteristic(service, DEVICE_FR_CHARACTERISTIC_UUID)
                getCharacteristic(service, DEVICE_HR_CHARACTERISTIC_UUID)
                getCharacteristic(service, DEVICE_MN_CHARACTERISTIC_UUID)
                break
              case BATTERY_SERVICE_UUID:
                getCharacteristic(service, BATTERY_CHARACTERISTIC_UUID)
                break
              case LED_SERVICE_UUID:
                getCharacteristic(service, LED_01_CHARACTERISTIC_UUID)
                getCharacteristic(service, LED_02_CHARACTERISTIC_UUID)
                break
              case UART_SERVICE_UUID:
                getCharacteristic(service, UART_TX_CHARACTERISTIC_UUID)
                getCharacteristic(service, UART_RX_CHARACTERISTIC_UUID)
                break
              default:
                break
            }
          }
        }
      }
    })
    .catch((error) => {
      console.log(error)
    })
}
const disconnect = () => {
  if (!motherboard.device) return
  if (motherboard.device.gatt?.connected) {
    motherboard.device.gatt?.disconnect()
  }
}
const onDisconnected = (event) => {
  motherboard.device = undefined
  const device = event.target
  console.log(`Device ${device.name} is disconnected.`)
}
const handleNotifications = (event) => {
  const characteristic = event.target
  const receivedData = new Uint8Array(characteristic.value.buffer)
  // Create an array to store the parsed decimal values
  const decimalArray = []
  // Iterate through each byte and convert to decimal
  for (let i = 0; i < receivedData.length; i++) {
    decimalArray.push(receivedData[i])
  }
  // Convert the decimal array to a string representation
  const receivedString = String.fromCharCode(...decimalArray)
  // Split the string into pairs of characters
  const hexPairs = receivedString.match(/.{1,2}/g)
  // Convert each hexadecimal pair to decimal
  const parsedDecimalArray = hexPairs?.map((hexPair) => parseInt(hexPair, 16))
  // Handle different types of data
  if (characteristic.value.byteLength === 20) {
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
  } else if (characteristic.value.byteLength === 14) {
    console.log(characteristic.value.byteLength, parsedDecimalArray)
  } else {
    console.log(characteristic.value.byteLength, parsedDecimalArray)
  }
}
const getCharacteristic = (service, uuid) => {
  service.getCharacteristic(uuid).then((characteristic) => {
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
  })
}
export default motherboard
export { disconnect, connect }
