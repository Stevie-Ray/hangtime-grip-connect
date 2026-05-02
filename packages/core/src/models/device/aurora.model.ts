import { Device } from "../device.model.js"
import type { AuroraLedPlacement, IAurora } from "../../interfaces/device/aurora.interface.js"

type AuroraApiLevel = 2 | 3

export interface AuroraPlacementRole {
  id: number
  product_id: number
  position: number
  name: string
  full_name: string
  led_color: string
  screen_color: string
}

interface AuroraPacketMarkers {
  middle: AuroraPacket
  first: AuroraPacket
  last: AuroraPacket
  only: AuroraPacket
}

interface AuroraResolvedPlacement {
  position: number
  colorHex: string
}

/**
 * For API level 2 and API level 3.
 * The first byte in the data is dependent on where the packet is in the message as a whole.
 */
export enum AuroraPacket {
  /** If this packet is in the middle, the byte gets set to 77 (M). */
  V2_MIDDLE = 77,
  /** If this packet is the first packet in the message, then this byte gets set to 78 (N). */
  V2_FIRST,
  /** If this is the last packet in the message, this byte gets set to 79 (O). */
  V2_LAST,
  /** If this packet is the only packet in the message, the byte gets set to 80 (P). Note that this takes priority over the other conditions. */
  V2_ONLY,
  /** If this packet is in the middle, the byte gets set to 81 (Q). */
  V3_MIDDLE,
  /** If this packet is the first packet in the message, then this byte gets set to 82 (R). */
  V3_FIRST,
  /** If this is the last packet in the message, this byte gets set to 83 (S). */
  V3_LAST,
  /** If this packet is the only packet in the message, the byte gets set to 84 (T). Note that this takes priority over the other conditions. */
  V3_ONLY,
}

/**
 * Board specific placement roles, extracted from placement_roles database table.
 */
export const AuroraPlacementRoles: AuroraPlacementRole[] = []

/**
 * Represents a Aurora Climbing device.
 * Kilter Board, Tension Board, Decoy Board, Touchstone Board, Grasshopper Board, Aurora Board, So iLL Board
 * {@link https://auroraclimbing.com}
 */
export class Aurora extends Device implements IAurora {
  /**
   * UUID for the Aurora Climbing Advertising service.
   * This constant is used to identify the specific Bluetooth service for Aurora LED boards.
   * @type {string}
   * @static
   * @readonly
   * @constant
   */
  static readonly AuroraUUID: string = "4488b571-7806-4df6-bcff-a2897e4953ff"

  /**
   * Maximum length of the message body for byte wrapping.
   * This value defines the limit for the size of messages that can be sent or received
   * to ensure proper byte wrapping in communication.
   * @type {number}
   * @private
   * @readonly
   * @constant
   */
  private static readonly messageBodyMaxLength: number = 255

  /**
   * Maximum length of the Bluetooth message chunk.
   * This value sets the upper limit for the size of individual Bluetooth messages
   * sent to and from the device to comply with Bluetooth protocol constraints.
   * @type {number}
   * @private
   * @readonly
   * @constant
   */
  private static readonly maxBluetoothMessageSize: number = 20

  private apiLevel: AuroraApiLevel

  constructor() {
    super({
      filters: [
        {
          services: [Aurora.AuroraUUID],
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

    this.apiLevel = 2
  }

  protected get placementRoles(): readonly AuroraPlacementRole[] {
    return AuroraPlacementRoles
  }

  /**
   * Sets the API level from the Aurora board name format:
   * display name, optional #serial, optional trailing @apiLevel. Missing @apiLevel defaults to API level 2.
   * @param name - The name of the device.
   */
  protected setApiLevelFromDeviceName(name?: string | null): void {
    const detectedApiLevel = this.getApiLevelFromDeviceName(name)

    this.apiLevel = detectedApiLevel
  }

  protected override onBluetoothDeviceSelected(device: BluetoothDevice): void {
    this.setApiLevelFromDeviceName(device.name)
  }

  private getApiLevelFromDeviceName(name?: string | null): AuroraApiLevel {
    const apiLevel = name?.match(/@(\d+)$/)?.[1]

    if (apiLevel === undefined) {
      return 2
    }

    return this.normalizeApiLevel(Number(apiLevel))
  }

  private normalizeApiLevel(apiLevel: number): AuroraApiLevel {
    if (apiLevel !== 2 && apiLevel !== 3) {
      throw new Error(`Unsupported Aurora Board API level: ${apiLevel}`)
    }

    return apiLevel
  }

  /**
   * Calculates the checksum for a byte array by summing up all packet-data bytes in a single-byte variable.
   * @param data - The array of bytes to calculate the checksum for.
   * @returns {number} The calculated checksum value.
   */
  private checksum(data: number[]): number {
    let i = 0
    for (const value of data) {
      i = (i + value) & 255
    }
    return ~i & 255
  }

  /**
   * Wraps a byte array with header and footer bytes for transmission.
   * @param data - The array of bytes to wrap.
   * @returns {number[]} The wrapped byte array.
   */
  private wrapBytes(data: number[]): number[] {
    if (data.length > Aurora.messageBodyMaxLength) {
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
   * Encodes an API level 2 position into two bytes.
   * The lowest 8 bits go in the first byte; the highest 2 bits are reserved for the second byte.
   * @param position - The position to encode.
   * @returns {number[]} The encoded byte array representing the position.
   */
  private validatePosition(position: number, maxPosition: number, apiLevel: AuroraApiLevel): void {
    if (!Number.isInteger(position) || position < 0 || position > maxPosition) {
      throw new Error(
        `Aurora Board API level ${apiLevel} requires an integer LED position between 0 and ${maxPosition}`,
      )
    }
  }

  private encodePositionV2(position: number): number[] {
    this.validatePosition(position, 0x3ff, 2)

    const position1 = position & 255
    const position2 = (position & 0x300) >> 8

    return [position1, position2]
  }

  /**
   * Encodes an API level 3 position into two bytes.
   * The lowest 8 bits go in the first byte; the highest 8 bits go in the second byte.
   * @param position - The position to encode.
   * @returns {number[]} The encoded byte array representing the position.
   */
  private encodePositionV3(position: number): number[] {
    this.validatePosition(position, 0xffff, 3)

    const position1 = position & 255
    const position2 = (position & 65280) >> 8

    return [position1, position2]
  }

  /**
   * Encodes a color string into a numeric representation.
   * The rgb color, 3 bits for the R and G components, 2 bits for the B component, with the 3 R bits occupying the high end of the byte and the 2 B bits in the low end (hence 3 G bits in the middle).
   * Format: 0bRRRGGGBB where RRR is 3 bits for red, GGG is 3 bits for green, BB is 2 bits for blue.
   * @param color - The color string in hexadecimal format (e.g., 'FFFFFF').
   * @returns The encoded /compressed color value.
   */
  private encodeColorV3(color: string): number {
    const r = parseInt(color.substring(0, 2), 16)
    const g = parseInt(color.substring(2, 4), 16)
    const b = parseInt(color.substring(4, 6), 16)

    // Integer division: R and G divided by 32, B divided by 64
    // Then pack into 0bRRRGGGBB format
    const rBits = Math.floor(r / 32) // 0-7 (3 bits)
    const gBits = Math.floor(g / 32) // 0-7 (3 bits)
    const bBits = Math.floor(b / 64) // 0-3 (2 bits)

    // Pack: RRR in bits 7-5, GGG in bits 4-2, BB in bits 1-0
    return (rBits << 5) | (gBits << 2) | bBits
  }

  /**
   * Encodes a color string using API level 2's 2-bit RGB format.
   * Format: 0bRRGGBB00. The lowest two bits are reserved for the high bits of the LED position.
   * @param color - The color string in hexadecimal format (e.g., 'FFFFFF').
   * @returns The encoded /compressed color value.
   */
  private encodeColorV2(color: string): number {
    const r = parseInt(color.substring(0, 2), 16)
    const g = parseInt(color.substring(2, 4), 16)
    const b = parseInt(color.substring(4, 6), 16)

    const rBits = Math.floor(r / 64) // 0-3 (2 bits)
    const gBits = Math.floor(g / 64) // 0-3 (2 bits)
    const bBits = Math.floor(b / 64) // 0-3 (2 bits)

    return (rBits << 6) | (gBits << 4) | (bBits << 2)
  }

  private normalizeColor(color: string): string {
    const colorHex = color.trim().replace(/^#/, "").toUpperCase()

    if (!/^[0-9A-F]{6}$/.test(colorHex)) {
      throw new Error(`Invalid Aurora Board LED color: ${color}`)
    }

    return colorHex
  }

  /**
   * Encodes an API level 2 placement into two bytes.
   * API level 2 stores a 10-bit position and a 2-bit-per-channel RGB color.
   * @param position - The position to encode.
   * @param ledColor - The color of the LED in hexadecimal format (e.g., 'FFFFFF').
   * @returns The encoded byte array representing the placement.
   */
  private encodePlacementV2(position: number, ledColor: string): number[] {
    const [position1, position2] = this.encodePositionV2(position)

    return [position1, this.encodeColorV2(ledColor) | position2]
  }

  /**
   * Encodes an API level 3 placement into three bytes.
   * API level 3 stores a 16-bit position and a 3/3/2-bit RGB color.
   * @param position - The position to encode.
   * @param ledColor - The color of the LED in hexadecimal format (e.g., 'FFFFFF').
   * @returns The encoded byte array representing the placement.
   */
  private encodePlacementV3(position: number, ledColor: string): number[] {
    return [...this.encodePositionV3(position), this.encodeColorV3(ledColor)]
  }

  /**
   * Resolves placements into LED positions and concrete hex colors.
   * @param climbPlacementList - The list of climb placements containing position and either role ID or color.
   * @returns The resolved placements ready for API-level encoding.
   */
  private resolvePlacements(climbPlacementList: AuroraLedPlacement[]): AuroraResolvedPlacement[] {
    return climbPlacementList.flatMap((climbPlacement) => {
      const hasColor = climbPlacement.color != null && climbPlacement.color.trim() !== ""
      const hasRoleId = typeof climbPlacement.role_id === "number" && !isNaN(climbPlacement.role_id)

      if (!hasColor && !hasRoleId) {
        return []
      }

      if (hasColor && climbPlacement.color !== undefined) {
        return [
          {
            position: climbPlacement.position,
            colorHex: this.normalizeColor(climbPlacement.color),
          },
        ]
      }

      const role = this.placementRoles.find((placement) => placement.id === climbPlacement.role_id)

      if (!role) {
        throw new Error(
          `Role with id ${climbPlacement.role_id} not found in placement_roles for ${this.constructor.name}`,
        )
      }

      return [
        {
          position: climbPlacement.position,
          colorHex: role.led_color,
        },
      ]
    })
  }

  private buildPayload(
    resolvedPlacements: AuroraResolvedPlacement[],
    markers: AuroraPacketMarkers,
    bytesPerPlacement: number,
    encodePlacement: (position: number, ledColor: string) => number[],
  ): number[] {
    const resultArray: number[][] = []
    let tempArray: number[] = [markers.middle]

    for (const climbPlacement of resolvedPlacements) {
      if (tempArray.length + bytesPerPlacement > Aurora.messageBodyMaxLength) {
        resultArray.push(tempArray)
        tempArray = [markers.middle]
      }

      const encodedPlacement = encodePlacement(climbPlacement.position, climbPlacement.colorHex)
      tempArray.push(...encodedPlacement)
    }

    resultArray.push(tempArray)

    if (resultArray.length === 1) {
      resultArray[0][0] = markers.only
    } else if (resultArray.length > 1) {
      resultArray[0][0] = markers.first
      resultArray[resultArray.length - 1][0] = markers.last
    }

    const finalResultArray: number[] = []
    for (const currentArray of resultArray) {
      finalResultArray.push(...this.wrapBytes(currentArray))
    }

    return finalResultArray
  }

  /**
   * Prepares API level 2 byte arrays for transmission based on a list of climb placements.
   * @param climbPlacementList - The list of climb placements containing position and either role ID or color.
   * @returns The final byte array ready for transmission.
   */
  private prepBytesV2(climbPlacementList: AuroraLedPlacement[]): number[] {
    return this.buildPayload(
      this.resolvePlacements(climbPlacementList),
      {
        middle: AuroraPacket.V2_MIDDLE,
        first: AuroraPacket.V2_FIRST,
        last: AuroraPacket.V2_LAST,
        only: AuroraPacket.V2_ONLY,
      },
      2,
      (position, ledColor) => this.encodePlacementV2(position, ledColor),
    )
  }

  /**
   * Prepares API level 3 byte arrays for transmission based on a list of climb placements.
   * @param climbPlacementList - The list of climb placements containing position and either role ID or color.
   * @returns The final byte array ready for transmission.
   */
  private prepBytesV3(climbPlacementList: AuroraLedPlacement[]): number[] {
    return this.buildPayload(
      this.resolvePlacements(climbPlacementList),
      {
        middle: AuroraPacket.V3_MIDDLE,
        first: AuroraPacket.V3_FIRST,
        last: AuroraPacket.V3_LAST,
        only: AuroraPacket.V3_ONLY,
      },
      3,
      (position, ledColor) => this.encodePlacementV3(position, ledColor),
    )
  }

  private prepBytes(climbPlacementList: AuroraLedPlacement[], apiLevel: AuroraApiLevel): number[] {
    return apiLevel === 2 ? this.prepBytesV2(climbPlacementList) : this.prepBytesV3(climbPlacementList)
  }

  /**
   * Splits a collection into slices of the specified length.
   * https://github.com/ramda/ramda/blob/master/source/splitEvery
   * @param {Number} n
   * @param {Array} list
   * @return {Array<number[]>}
   */
  private splitEvery(n: number, list: number[]): number[][] {
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
   * Aurora boards only support messages of 20 bytes
   * at a time. This method splits a full message into parts
   * of 20 bytes
   *
   * @param buffer
   */
  private splitMessages = (buffer: number[]) =>
    this.splitEvery(Aurora.maxBluetoothMessageSize, buffer).map((arr) => new Uint8Array(arr))

  /**
   * Sends a series of messages to a device.
   */
  private async writeMessageSeries(messages: Uint8Array[]) {
    for (const message of messages) {
      await this.write("uart", "tx", message)
    }
  }

  /**
   * Configures the LEDs based on an array of climb placements.
   * @param config - Array of climb placements for the LEDs. Either role_id or color (hex string) must be provided.
   * @returns {Promise<number[] | undefined>} A promise that resolves with the payload array for the Aurora board if LED settings were applied, or `undefined` if no action was taken.
   */
  led = async (config: AuroraLedPlacement[] = []): Promise<number[] | undefined> => {
    // Handle Aurora LED board logic: process placements and send payload if connected
    if (Array.isArray(config)) {
      // Prepares byte arrays for transmission based on a list of climb placements.
      const payload = this.prepBytes(config, this.apiLevel)
      if (this.isConnected()) {
        await this.writeMessageSeries(this.splitMessages(payload))
      }
      return payload
    }
    return undefined
  }
}

/**
 * Aurora Board (Aurora Board, BoulderHouse 55, Volume 1 Board, Aaron's Board, Wall-E, FLOW, TreeHouse, CRG Cambridge)
 * {@link https://auroraboardapp.com}
 */
export class AuroraBoard extends Aurora implements IAurora {
  protected override get placementRoles(): readonly AuroraPlacementRole[] {
    return [
      {
        id: 1,
        product_id: 1,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 2,
        product_id: 1,
        position: 2,
        name: "middle",
        full_name: "Any",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 3,
        product_id: 1,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 4,
        product_id: 2,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 5,
        product_id: 2,
        position: 2,
        name: "middle",
        full_name: "Any",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 6,
        product_id: 2,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 7,
        product_id: 2,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 8,
        product_id: 3,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 9,
        product_id: 3,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 10,
        product_id: 3,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 11,
        product_id: 3,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 12,
        product_id: 4,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 13,
        product_id: 4,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 14,
        product_id: 4,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 15,
        product_id: 4,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 16,
        product_id: 5,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 17,
        product_id: 5,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 18,
        product_id: 5,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 19,
        product_id: 5,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 20,
        product_id: 6,
        position: 0,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 21,
        product_id: 6,
        position: 1,
        name: "middle",
        full_name: "Any",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 22,
        product_id: 6,
        position: 2,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 23,
        product_id: 6,
        position: 3,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 24,
        product_id: 6,
        position: 4,
        name: "aux",
        full_name: "Aux",
        led_color: "FFFF00",
        screen_color: "FFFF00",
      },
      {
        id: 25,
        product_id: 7,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 26,
        product_id: 7,
        position: 2,
        name: "middle",
        full_name: "Any",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 27,
        product_id: 7,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 28,
        product_id: 7,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 29,
        product_id: 8,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 30,
        product_id: 8,
        position: 2,
        name: "middle",
        full_name: "Any",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 31,
        product_id: 8,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 32,
        product_id: 8,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
    ]
  }
}

/**
 * Decoy Board
 * {@link https://decoyboardapp.com/}
 */
export class DecoyBoard extends Aurora implements IAurora {
  protected override get placementRoles(): readonly AuroraPlacementRole[] {
    return [
      {
        id: 1,
        product_id: 1,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 2,
        product_id: 1,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 3,
        product_id: 1,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 4,
        product_id: 1,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
    ]
  }
}

/**
 * Grasshopper Board
 * {@link https://grasshopperboardapp.com/}
 */
export class GrasshopperBoard extends Aurora implements IAurora {
  protected override get placementRoles(): readonly AuroraPlacementRole[] {
    return [
      {
        id: 1,
        product_id: 1,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 3,
        product_id: 1,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 4,
        product_id: 1,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 2,
        product_id: 1,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "0000FF",
        screen_color: "4455FF",
      },
    ]
  }
}

/**
 * Kilter Board (Kilter Board Original, Kilter Board Homewall, JUUL, Demo Board, BKB Board, Tycho, Spire)
 * {@link https://kilterclimbing.com}
 */
export class KilterBoard extends Aurora implements IAurora {
  protected override get placementRoles(): readonly AuroraPlacementRole[] {
    return [
      {
        id: 12,
        product_id: 1,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 13,
        product_id: 1,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "00FFFF",
        screen_color: "00FFFF",
      },
      {
        id: 14,
        product_id: 1,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 15,
        product_id: 1,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FFB600",
        screen_color: "FFA500",
      },
      {
        id: 20,
        product_id: 2,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 21,
        product_id: 2,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "00FFFF",
        screen_color: "00FFFF",
      },
      {
        id: 22,
        product_id: 2,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 23,
        product_id: 2,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FFA500",
        screen_color: "FFA500",
      },
      {
        id: 24,
        product_id: 3,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 25,
        product_id: 3,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "00FFFF",
        screen_color: "00FFFF",
      },
      {
        id: 26,
        product_id: 3,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 27,
        product_id: 3,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FFA500",
        screen_color: "FFA500",
      },
      {
        id: 28,
        product_id: 4,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 29,
        product_id: 4,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "00FFFF",
        screen_color: "00FFFF",
      },
      {
        id: 30,
        product_id: 4,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 31,
        product_id: 4,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FFA500",
        screen_color: "FFA500",
      },
      {
        id: 32,
        product_id: 5,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 33,
        product_id: 5,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "00FFFF",
        screen_color: "00FFFF",
      },
      {
        id: 34,
        product_id: 5,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 35,
        product_id: 5,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FFA500",
        screen_color: "FFA500",
      },
      {
        id: 36,
        product_id: 6,
        position: 1,
        name: "cyan",
        full_name: "Cyan",
        led_color: "00FFFF",
        screen_color: "00FFFF",
      },
      {
        id: 37,
        product_id: 6,
        position: 2,
        name: "magenta",
        full_name: "Magenta",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 38,
        product_id: 6,
        position: 3,
        name: "yellow",
        full_name: "Yellow",
        led_color: "FFFF00",
        screen_color: "FFFF00",
      },
      {
        id: 39,
        product_id: 6,
        position: 4,
        name: "green",
        full_name: "Green",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 40,
        product_id: 6,
        position: 5,
        name: "red",
        full_name: "Red",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 41,
        product_id: 6,
        position: 6,
        name: "blue",
        full_name: "Blue",
        led_color: "0000FF",
        screen_color: "0000FF",
      },
      {
        id: 42,
        product_id: 7,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 43,
        product_id: 7,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "00FFFF",
        screen_color: "00FFFF",
      },
      {
        id: 44,
        product_id: 7,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 45,
        product_id: 7,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FFA500",
        screen_color: "FFA500",
      },
    ]
  }
}

/**
 * So iLL Board
 * {@link https://soillboardapp.com/}
 */
export class SoiLLBoard extends Aurora implements IAurora {
  protected override get placementRoles(): readonly AuroraPlacementRole[] {
    return [
      {
        id: 1,
        product_id: 1,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 2,
        product_id: 1,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 3,
        product_id: 1,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FFFFFF",
        screen_color: "7F7F7F",
      },
      {
        id: 4,
        product_id: 1,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "00FFFF",
        screen_color: "00FFFF",
      },
    ]
  }
}

/**
 * Tension Board (Tension Board, Tension Board 2)
 * {@link https://tensionboardapp2.com/}
 */
export class TensionBoard extends Aurora implements IAurora {
  protected override get placementRoles(): readonly AuroraPlacementRole[] {
    return [
      {
        id: 1,
        product_id: 4,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 3,
        product_id: 4,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 4,
        product_id: 4,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 5,
        product_id: 5,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 7,
        product_id: 5,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 8,
        product_id: 5,
        position: 4,
        name: "foot",
        full_name: "Foot Only",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 2,
        product_id: 4,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "0000FF",
        screen_color: "0066FF",
      },
      {
        id: 6,
        product_id: 5,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "0000FF",
        screen_color: "0066FF",
      },
    ]
  }
}

/**
 * Touchstone Board
 * {@link https://touchstoneboardapp.com/}
 */
export class TouchstoneBoard extends Aurora implements IAurora {
  protected override get placementRoles(): readonly AuroraPlacementRole[] {
    return [
      {
        id: 1,
        product_id: 1,
        position: 1,
        name: "start",
        full_name: "Start",
        led_color: "00FF00",
        screen_color: "00DD00",
      },
      {
        id: 3,
        product_id: 1,
        position: 3,
        name: "finish",
        full_name: "Finish",
        led_color: "FF0000",
        screen_color: "FF0000",
      },
      {
        id: 4,
        product_id: 1,
        position: 4,
        name: "foot",
        full_name: "Foot",
        led_color: "FF00FF",
        screen_color: "FF00FF",
      },
      {
        id: 2,
        product_id: 1,
        position: 2,
        name: "middle",
        full_name: "Middle",
        led_color: "0000FF",
        screen_color: "4444FF",
      },
    ]
  }
}
