import { notifyCallback } from "./notify"
// import { applyTare } from "./tare"
import { ProgressorCommands, ProgressorResponses } from "./commands/progressor"
import { MotherboardCommands } from "./commands"
import { lastWrite } from "./write"
import struct from "./struct"

// Interfaces
interface MotherboardPacket {
  received: number
  sampleNum: number
  battRaw: number
  samples: number[]
  masses: number[]
}

// Constants
const PACKET_LENGTH: number = 32
const NUM_SAMPLES: number = 3
let MASS_MAX: string = "0"
let MASS_AVERAGE: string = "0"
let MASS_TOTAL_SUM: number = 0;
let DATAPOINT_COUNT: number = 0;
export const CALIBRATION = [[], [], [], []]


/**
 * Applies calibration to a sample value.
 * @param {number} sample - The sample value to calibrate.
 * @param {number[][]} calibration - The calibration data.
 * @returns {number} The calibrated sample value.
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
/**
 * Handles data received from the Motherboard device.
 * @param {string} receivedData - The received data string.
 */
export const handleMotherboardData = (receivedData: string): void => {
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
    const packet: MotherboardPacket = {
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
      packet.masses[i] = applyCalibration(packet.samples[i], CALIBRATION[i])
    }
    // invert center and right values
    packet.masses[1] *= -1
    packet.masses[2] *= -1

    const left: number = packet.masses[0]
    const center: number = packet.masses[1]
    const right: number = packet.masses[2]

    MASS_MAX = Math.max(
      Number(MASS_MAX),
      Math.max(-1000, left + center + right),
    ).toFixed(1)

    // Update running sum and count
    const currentMassTotal = Math.max(-1000, left + center + right);
    MASS_TOTAL_SUM += currentMassTotal;
    DATAPOINT_COUNT++;

    // Calculate the average dynamically
    MASS_AVERAGE = (MASS_TOTAL_SUM / DATAPOINT_COUNT).toFixed(1);

    // TODO: Apply tare adjustments
    // tares = applyTare(packet.masses)
    // left += tares[0];
    // center += tares[1];
    // right += tares[2];
    // Notify with weight data
    notifyCallback({
      massTotal: Math.max(-1000, left + center + right).toFixed(1),
      massMax: MASS_MAX,
      massAverage: MASS_AVERAGE,
      massLeft: Math.max(-1000, packet.masses[0]).toFixed(1),
      massCenter: Math.max(-1000, packet.masses[1]).toFixed(1),
      massRight: Math.max(-1000, packet.masses[2]).toFixed(1),
    })
  } else if (lastWrite === MotherboardCommands.GET_CALIBRATION) {
    // check data integrity
    if ((receivedData.match(/,/g) || []).length === 3) {
      const parts: string[] = receivedData.split(",")
      const numericParts: number[] = parts.map((x) => parseFloat(x))
      ;(CALIBRATION[numericParts[0]] as number[][]).push(numericParts.slice(1))
    }
  } else {
    // unhandled data
    console.log(receivedData)
  }
}

/**
 * Handles data received from the Progressor device.
 * @param {DataView} data - The received data.
 */
export const handleProgressorData = (data: DataView): void => {
  const tare: number = 0 // Placeholder for tare value, replace with actual tare logic
  const [kind] = struct("<bb").unpack(data.buffer.slice(0, 2))
  if (kind === ProgressorResponses.WEIGHT_MEASURE) {
    const iterable = struct("<fi").iter_unpack(data.buffer.slice(2))
    for (const [weight] of iterable) {
      MASS_MAX = Math.max(Number(MASS_MAX), Number(weight)).toFixed(1)
      notifyCallback({
        massMax: MASS_MAX,
        massAverage: MASS_AVERAGE,
        massTotal: Math.max(-1000, Number(weight) - tare).toFixed(1),
      })
    }
  } else if (kind === ProgressorResponses.COMMAND_RESPONSE) {
    if (!lastWrite) return

    let value: string = ""

    if (lastWrite === ProgressorCommands.GET_BATT_VLTG) {
      const vdd = new DataView(data.buffer, 2).getUint32(0, true)
      value = `ℹ️ Battery level: ${vdd} mV`
    } else if (lastWrite === ProgressorCommands.GET_FW_VERSION) {
      value = new TextDecoder().decode(data.buffer.slice(2))
    } else if (lastWrite === ProgressorCommands.GET_ERR_INFO) {
      value = new TextDecoder().decode(data.buffer.slice(2))
    }
    console.log(value)
  } else if (kind === ProgressorResponses.LOW_BATTERY_WARNING) {
    console.warn("⚠️ Low power detected. Please consider connecting to a power source.")
  } else {
    console.error(`❌ Error: Unknown message kind detected: ${kind}`)
  }
}
/**
 * Handles data received from the Entralpi device.
 * @param {string} receivedData - The received data string.
 */
export const handleEntralpiData = (receivedData: string): void => {
  MASS_MAX = Math.max(Number(MASS_MAX), Number(receivedData)).toFixed(1)
  // Update running sum and count
  const currentMassTotal = Math.max(-1000, Number(receivedData));
  MASS_TOTAL_SUM += currentMassTotal;
  DATAPOINT_COUNT++;

  // Calculate the average dynamically
  MASS_AVERAGE = (MASS_TOTAL_SUM / DATAPOINT_COUNT).toFixed(1);
  notifyCallback({
    massMax: MASS_MAX,
    massAverage: MASS_AVERAGE,
    massTotal: Math.max(-1000, Number(receivedData)).toFixed(1),
  })
}
