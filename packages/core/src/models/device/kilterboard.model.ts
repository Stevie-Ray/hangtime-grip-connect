import { Device } from "../device.model"
import type { IKilterBoard } from "../../interfaces/device/kilterboard.interface"
import { KilterBoardPacket, KilterBoardPlacementRoles } from "../../commands/kilterboard"
import { write } from "../../write"

/**
 * Aurora Climbing Advertising service
 */
export const AuroraUUID = "4488b571-7806-4df6-bcff-a2897e4953ff"

/**
 * Maximum length of the message body for byte wrapping.
 */
const MESSAGE_BODY_MAX_LENGTH = 255
/**
 * Maximum length of the the bluetooth chunk.
 */
const MAX_BLUETOOTH_MESSAGE_SIZE = 20

class ClimbPlacement {
  position: number
  role_id: number

  constructor(position: number, role_id: number) {
    this.position = position
    this.role_id = role_id
  }
}

/**
 * Represents a Aurora Climbing device
 * Kilter Board, Tension Board, Decoy Board, Touchstone Board, Grasshopper Board, Aurora Board, So iLL Board
 */
export class KilterBoard extends Device implements IKilterBoard {
  constructor() {
    super({
      filters: [
        {
          services: [AuroraUUID],
        },
      ],
      services: [
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
            // {
            //   name: "RX",
            //   id: "rx",
            //   uuid: "6e400003-b5a3-f393-e0a9-e50e24dcca9e",
            // },
          ],
        },
      ],
    })
  }

  /**
   * Calculates the checksum for a byte array by summing up all bytes ot hre packet in a single-byte variable.
   * @param data - The array of bytes to calculate the checksum for.
   * @returns The calculated checksum value.
   */
  checksum(data: number[]) {
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
  wrapBytes(data: number[]) {
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
    return [1, data.length, this.checksum(data), 2, ...data, 3]
  }
  /**
   * Encodes a position into a byte array.
   * The lowest 8 bits of the position get put in the first byte of the group.
   * The highest 8 bits of the position get put in the second byte of the group.
   * @param position - The position to encode.
   * @returns The encoded byte array representing the position.
   */
  encodePosition(position: number) {
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
  encodeColor(color: string) {
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
  encodePlacement(position: number, ledColor: string) {
    return [...this.encodePosition(position), this.encodeColor(ledColor)]
  }
  /**
   * Prepares byte arrays for transmission based on a list of climb placements.
   * @param climbPlacementList - The list of climb placements containing position and role ID.
   * @returns The final byte array ready for transmission.
   */
  prepBytesV3(climbPlacementList: ClimbPlacement[]) {
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
      const encodedPlacement = this.encodePlacement(climbPlacement.position, role.led_color)
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
      finalResultArray.push(...this.wrapBytes(currentArray))
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
  splitEvery(n: number, list: number[]) {
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
  splitMessages = (buffer: number[]) =>
    this.splitEvery(MAX_BLUETOOTH_MESSAGE_SIZE, buffer).map((arr) => new Uint8Array(arr))
  /**
   * Sends a series of messages to a device.
   */
  async writeMessageSeries(messages: Uint8Array[]) {
    for (const message of messages) {
      await write(this, "uart", "tx", message)
    }
  }
  /**
   * Configures the LEDs based on an array of climb placements. If a configuration is provided, it prepares and sends a payload to the device.
   * @param {ClimbPlacement[]} [config] - Optional color or array of climb placements for the LEDs. Ignored if placements are provided.
   * @returns {Promise<number[] | undefined>} A promise that resolves with the payload array for the Kilter Board if LED settings were applied, or `undefined` if no action was taken or for the Motherboard.
   */
  led = async (config?: ClimbPlacement[]): Promise<number[] | undefined> => {
    // Handle Kilterboard logic: process placements and send payload if connected
    if (Array.isArray(config)) {
      // Prepares byte arrays for transmission based on a list of climb placements.
      const payload = this.prepBytesV3(config)
      if (this.isConnected()) {
        await this.writeMessageSeries(this.splitMessages(payload))
      }
      return payload
    }
    return undefined
  }
}