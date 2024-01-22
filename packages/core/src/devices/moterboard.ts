import { Device } from "./types"
import { notifyCallback } from "../notify"

const PACKET_LENGTH: number = 32
const NUM_SAMPLES: number = 3
const CALIBRATION = [[], [], [], []]

export const Motherboard: Device = {
  name: "Motherboard",
  companyId: 0x2a29,
  services: [
    {
      name: "Device Information",
      id: "device",
      uuid: "0000180a-0000-1000-8000-00805f9b34fb",
      characteristics: [
        // {
        //     name: 'Serial Number (Blocked)',
        //     id: 'serial'
        //     uuid: '00002a25-0000-1000-8000-00805f9b34fb'
        // },
        {
          name: "Firmware Revision",
          id: "firmware",
          uuid: "00002a26-0000-1000-8000-00805f9b34fb",
        },
        {
          name: "Hardware Revision",
          id: "hardware",
          uuid: "00002a27-0000-1000-8000-00805f9b34fb",
        },
        {
          name: "Manufacturer Name",
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
      name: "Unknown Service",
      id: "unknown",
      uuid: "10ababcd-15e1-28ff-de13-725bea03b127",
      characteristics: [
        {
          name: "Unknown 01",
          id: "01",
          uuid: "10ab1524-15e1-28ff-de13-725bea03b127",
        },
        {
          name: "Unknown 02",
          id: "02",
          uuid: "10ab1525-15e1-28ff-de13-725bea03b127",
        },
      ],
    },
    {
      name: "UART Nordic Service",
      id: "uart",
      uuid: "6e400001-b5a3-f393-e0a9-e50e24dcca9e",
      characteristics: [
        {
          name: "TX",
          id: "tx",
          uuid: "6e400002-b5a3-f393-e0a9-e50e24dcca9e",
        },
        {
          name: "RX",
          id: "rx",
          uuid: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
        },
      ],
    },
  ],
}
/**
 * applyCalibration
 * @param sample
 * @param calibration
 */
const applyCalibration = (sample: number, calibration: number[][]): number => {
  // Extract the calibrated value for the zero point
  const zeroCalibration: number = calibration[0][2]

  // Initialize sign as positive
  let sign: number = 1

  // Initialize the final calibrated value
  let final: number = 0

  // If the sample value is less than the zero calibration point
  if (sample < zeroCalibration) {
    // Change the sign to negative
    sign = -1

    // Reflect the sample around the zero calibration point
    sample = 2 * zeroCalibration - sample
  }

  // Iterate through the calibration data
  for (let i = 1; i < calibration.length; i++) {
    // Extract the lower and upper bounds of the current calibration range
    const calibrationStart: number = calibration[i - 1][2]
    const calibrationEnd: number = calibration[i][2]

    // If the sample value is within the current calibration range
    if (sample < calibrationEnd) {
      // Interpolate to get the calibrated value within the range
      final =
        calibration[i - 1][1] +
        ((sample - calibrationStart) / (calibrationEnd - calibrationStart)) *
          (calibration[i][1] - calibration[i - 1][1])
      break
    }
  }
  // Return the calibrated value with the appropriate sign (positive/negative)
  return sign * final
}

interface Packet {
  received: number
  sampleNum: number
  battRaw: number
  samples: number[]
  masses: number[]
}

/**
 * handleMotherboardData
 * @param uuid - Unique identifier
 * @param receivedData - Received data string
 */
export function handleMotherboardData(uuid: string, receivedData: string): void {
  const receivedTime: number = Date.now()

  // Check if the line is entirely hex characters
  const isAllHex: boolean = /^[0-9A-Fa-f]+$/g.test(receivedData)

  // Handle streaming packet
  if (isAllHex && receivedData.length === PACKET_LENGTH) {
    // Base-16 decode the string: convert hex pairs to byte values
    const bytes: number[] = Array.from({ length: receivedData.length / 2 }, (_, i) =>
      Number(`0x${receivedData.substring(i * 2, i * 2 + 2)}`),
    )

    // Translate header into packet, number of samples from the packet length
    const packet: Packet = {
      received: receivedTime,
      sampleNum: new DataView(new Uint8Array(bytes).buffer).getUint16(0, true),
      battRaw: new DataView(new Uint8Array(bytes).buffer).getUint16(2, true),
      samples: [],
      masses: [],
    }

    const dataView = new DataView(new Uint8Array(bytes).buffer)

    for (let i = 0; i < NUM_SAMPLES; i++) {
      const sampleStart: number = 4 + 3 * i
      // Use DataView to read the 24-bit unsigned integer
      const rawValue =
        dataView.getUint8(sampleStart) |
        (dataView.getUint8(sampleStart + 1) << 8) |
        (dataView.getUint8(sampleStart + 2) << 16)

      // Ensure unsigned 32-bit integer
      packet.samples[i] = rawValue >>> 0

      if (packet.samples[i] >= 0x7fffff) {
        packet.samples[i] -= 0x1000000
      }

      // TODO: make sure device is calibrated
      if (!CALIBRATION[0].length) return
      packet.masses[i] = applyCalibration(packet.samples[i], CALIBRATION[i])
    }

    const left: number = packet.masses[0]
    const center: number = packet.masses[1]
    const right: number = packet.masses[2]

    notifyCallback({
      uuid,
      value: {
        massTotal: Math.max(-1000, left + right + center).toFixed(3),
        massLeft: Math.max(-1000, left).toFixed(3),
        massRight: Math.max(-1000, right).toFixed(3),
        massCenter: Math.max(-1000, center).toFixed(3),
      },
    })
  } else if ((receivedData.match(/,/g) || []).length === 3) {
    console.log(receivedData)
    // if the returned notification is a calibration string add them to the array
    const parts: string[] = receivedData.split(",")
    const numericParts: number[] = parts.map((x) => parseFloat(x))
    ;(CALIBRATION[numericParts[0]] as number[][]).push(numericParts.slice(1))
  } else {
    // unhanded data
    console.log(receivedData)
  }
}
