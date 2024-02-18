import { notifyCallback } from "./notify"
import { ProgressorCommands, ProgressorResponses } from "./commands/progressor"
import { MotherboardCommands } from "./commands"
import { lastWrite } from "./write"
import struct from "./struct"

const PACKET_LENGTH: number = 32
const NUM_SAMPLES: number = 3
export const CALIBRATION = [[], [], [], []]
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
    sample = /* 2 * zeroCalibration */ -sample
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
 *
 * @param uuid - Unique identifier
 * @param receivedData - Received data string
 */
export const handleMotherboardData = (uuid: string, receivedData: string): void => {
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
      // if (!CALIBRATION[0].length) return
      packet.masses[i] = applyCalibration(packet.samples[i], CALIBRATION[i])
    }
    // invert center and right values
    packet.masses[1] *= -1
    packet.masses[2] *= -1
    // map to variables
    const left: number = packet.masses[0]
    const center: number = packet.masses[1]
    const right: number = packet.masses[2]
    if (notifyCallback) {
      notifyCallback({
        uuid,
        value: {
          massTotal: Math.max(-1000, left + right + center).toFixed(1),
          massLeft: Math.max(-1000, left).toFixed(1),
          massRight: Math.max(-1000, right).toFixed(1),
          massCenter: Math.max(-1000, center).toFixed(1),
        },
      })
    }
  } else if (lastWrite === MotherboardCommands.GET_CALIBRATION) {
    // check data integrity
    if ((receivedData.match(/,/g) || []).length === 3) {
      const parts: string[] = receivedData.split(",")
      const numericParts: number[] = parts.map((x) => parseFloat(x))
      ;(CALIBRATION[numericParts[0]] as number[][]).push(numericParts.slice(1))
    }
  } else {
    // unhanded data
    console.log(receivedData)
  }
}

export const handleProgressorData = (uuid: string, data: DataView): void => {
  const tare: number = 0 // todo: add tare
  const [kind] = struct("<bb").unpack(data.buffer.slice(0, 2))
  if (kind === ProgressorResponses.WEIGHT_MEASURE) {
    const iterable = struct("<fi").iter_unpack(data.buffer.slice(2))
    for (const [weight] of iterable) {
      if (notifyCallback) {
        notifyCallback({
          uuid: uuid,
          value: {
            massTotal: Math.max(-1000, Number(weight) - tare).toFixed(1),
          },
        })
      }
    }
  } else if (kind === ProgressorResponses.COMMAND_RESPONSE) {
    if (!lastWrite) return

    let value: string = ""

    if (lastWrite === ProgressorCommands.GET_BATT_VLTG) {
      const vdd = new DataView(data.buffer, 2).getUint32(0, true)
      value = `Battery level = ${vdd} [mV]`
    } else if (lastWrite === ProgressorCommands.GET_FW_VERSION) {
      value = new TextDecoder().decode(data.buffer.slice(2))
    } else if (lastWrite === ProgressorCommands.GET_ERR_INFO) {
      value = new TextDecoder().decode(data.buffer.slice(2))
    }
    if (notifyCallback) {
      notifyCallback({ uuid: uuid, value: value })
    }
  } else if (kind === ProgressorResponses.LOW_BATTERY_WARNING) {
    if (notifyCallback) {
      notifyCallback({ uuid: uuid, value: "low power warning" })
    }
  } else {
    if (notifyCallback) {
      notifyCallback({ uuid: uuid, value: `unknown message kind ${kind}` })
    }
  }
}
