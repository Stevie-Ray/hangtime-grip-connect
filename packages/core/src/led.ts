import type { Device } from "./types/devices"
import { write } from "./write"
import { isConnected } from "./is-connected"
import { KilterBoardPacket, KilterBoardPlacementRoles } from "./commands/kilterboard"
import { isKilterboard, isMotherboard } from "./is-device"

/**
 * Maximum length of the message body for byte wrapping.
 */
const MESSAGE_BODY_MAX_LENGTH = 255
/**
 * Maximum length of the the bluetooth chunk.
 */
const MAX_BLUETOOTH_MESSAGE_SIZE = 20
/**
 * Calculates the checksum for a byte array by summing up all bytes ot hre packet in a single-byte variable.
 * @param data - The array of bytes to calculate the checksum for.
 * @returns The calculated checksum value.
 */
function checksum(data: number[]) {
  let i = 0
  for (const value of data) {
    i = (i + value) & 255
  }
  return ~i & 255
}
/**
 * Wraps a byte array with header and footer bytes for transmission.
 * @param data - The array of bytes to wrap.
 * @returns The wrapped byte array.
 */
function wrapBytes(data: number[]) {
  if (data.length > MESSAGE_BODY_MAX_LENGTH) {
    return []
  }
  /**
  - 0x1
  - len(packets)
  - checksum(packets)
  - 0x2
  - *packets
  - 0x3
  
  First byte is always 1, the second is a number of packets, then checksum, then 2, packets themselves, and finally 3.
   */
  return [1, data.length, checksum(data), 2, ...data, 3]
}
class ClimbPlacement {
  position: number
  role_id: number

  constructor(position: number, role_id: number) {
    this.position = position
    this.role_id = role_id
  }
}
/**
 * Encodes a position into a byte array.
 * The lowest 8 bits of the position get put in the first byte of the group.
 * The highest 8 bits of the position get put in the second byte of the group.
 * @param position - The position to encode.
 * @returns The encoded byte array representing the position.
 */
function encodePosition(position: number) {
  const position1 = position & 255
  const position2 = (position & 65280) >> 8

  return [position1, position2]
}
/**
 * Encodes a color string into a numeric representation.
 * The rgb color, 3 bits for the R and G components, 2 bits for the B component, with the 3 R bits occupying the high end of the byte and the 2 B bits in the low end (hence 3 G bits in the middle).
 * @param color - The color string in hexadecimal format (e.g., 'FFFFFF').
 * @returns The encoded /compressed color value.
 */
function encodeColor(color: string) {
  const substring = color.substring(0, 2)
  const substring2 = color.substring(2, 4)

  const parsedSubstring = parseInt(substring, 16) / 32
  const parsedSubstring2 = parseInt(substring2, 16) / 32
  const parsedResult = (parsedSubstring << 5) | (parsedSubstring2 << 2)

  const substring3 = color.substring(4, 6)
  const parsedSubstring3 = parseInt(substring3, 16) / 64
  const finalParsedResult = parsedResult | parsedSubstring3

  return finalParsedResult
}
/**
 * Encodes a placement (requires a 16-bit position and a 24-bit rgb color. ) into a byte array.
 * @param position - The position to encode.
 * @param ledColor - The color of the LED in hexadecimal format (e.g., 'FFFFFF').
 * @returns The encoded byte array representing the placement.
 */
function encodePlacement(position: number, ledColor: string) {
  return [...encodePosition(position), encodeColor(ledColor)]
}
/**
 * Prepares byte arrays for transmission based on a list of climb placements.
 * @param climbPlacementList - The list of climb placements containing position and role ID.
 * @returns The final byte array ready for transmission.
 */
export function prepBytesV3(climbPlacementList: ClimbPlacement[]) {
  const resultArray: number[][] = []
  let tempArray: number[] = [KilterBoardPacket.V3_MIDDLE]

  for (const climbPlacement of climbPlacementList) {
    if (tempArray.length + 3 > MESSAGE_BODY_MAX_LENGTH) {
      resultArray.push(tempArray)
      tempArray = [KilterBoardPacket.V3_MIDDLE]
    }
    const role = KilterBoardPlacementRoles.find((placement) => placement.id === climbPlacement.role_id)
    if (!role) {
      throw new Error(`Role with id ${climbPlacement.role_id} not found in placement_roles`)
    }
    const encodedPlacement = encodePlacement(climbPlacement.position, role.led_color)
    tempArray.push(...encodedPlacement)
  }

  resultArray.push(tempArray)

  if (resultArray.length === 1) {
    resultArray[0][0] = KilterBoardPacket.V3_ONLY
  } else if (resultArray.length > 1) {
    resultArray[0][0] = KilterBoardPacket.V3_FIRST
    resultArray[resultArray.length - 1][0] = KilterBoardPacket.V3_LAST
  }

  const finalResultArray: number[] = []
  for (const currentArray of resultArray) {
    finalResultArray.push(...wrapBytes(currentArray))
  }

  return finalResultArray
}
/**
 * Splits a collection into slices of the specified length.
 * https://github.com/ramda/ramda/blob/master/source/splitEvery.js
 * @param {Number} n
 * @param {Array} list
 * @return {Array}
 */
function splitEvery(n: number, list: number[]) {
  if (n <= 0) {
    throw new Error("First argument to splitEvery must be a positive integer")
  }
  const result = []
  let idx = 0
  while (idx < list.length) {
    result.push(list.slice(idx, (idx += n)))
  }
  return result
}
/**
 * The kilter board only supports messages of 20 bytes
 * at a time. This method splits a full message into parts
 * of 20 bytes
 *
 * @param buffer
 */
const splitMessages = (buffer: number[]) =>
  splitEvery(MAX_BLUETOOTH_MESSAGE_SIZE, buffer).map((arr) => new Uint8Array(arr))
/**
 * Sends a series of messages to a device.
 */
async function writeMessageSeries(board: Device, messages: Uint8Array[]) {
  for (const message of messages) {
    await write(board, "uart", "tx", message)
  }
}
/**
 * Sets the LEDs on the specified device.
 *
 * - For Kilter Board: Configures the LEDs based on an array of climb placements. If a configuration is provided, it prepares and sends a payload to the device.
 * - For Motherboard: Sets the LED color based on a single color option. Defaults to turning the LEDs off if no configuration is provided.
 *
 * @param {Device} board - The device on which to set the LEDs.
 * @param {"green" | "red" | "orange" | ClimbPlacement[]} [config] - Optional color or array of climb placements for the LEDs. Ignored if placements are provided.
 * @returns {Promise<number[] | undefined>} A promise that resolves with the payload array for the Kilter Board if LED settings were applied, or `undefined` if no action was taken or for the Motherboard.
 */
export const led = async (
  board: Device,
  config?: "green" | "red" | "orange" | ClimbPlacement[],
): Promise<number[] | undefined> => {
  // Handle Kilterboard logic: process placements and send payload if connected
  if (isKilterboard(board) && Array.isArray(config)) {
    // Prepares byte arrays for transmission based on a list of climb placements.
    const payload = prepBytesV3(config)
    if (isConnected(board)) {
      await writeMessageSeries(board, splitMessages(payload))
    }
    return payload
  }
  // Handle Motherboard logic: set color if provided
  if (isMotherboard(board)) {
    const colorMapping: Record<string, number[][]> = {
      green: [[0x00], [0x01]],
      red: [[0x01], [0x00]],
      orange: [[0x01], [0x01]],
      off: [[0x00], [0x00]],
    }
    // Default to "off" color if config is not set or not found in colorMapping
    const color = typeof config === "string" && colorMapping[config] ? config : "off"
    const [redValue, greenValue] = colorMapping[color]
    await write(board, "led", "red", new Uint8Array(redValue))
    await write(board, "led", "green", new Uint8Array(greenValue), 1250)
    return
  }
  return
}
