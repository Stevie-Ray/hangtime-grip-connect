import { Device } from "../device.model.js"
import type { AuroraLedPlacement, IAurora } from "../../interfaces/device/aurora.interface.js"

type AuroraApiLevel = 2 | 3

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
 * Represents a Aurora Climbing device.
 * Aurora Board
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
   * @param climbPlacementList - The list of climb placements containing position and color.
   * @returns The resolved placements ready for API-level encoding.
   */
  private resolvePlacements(climbPlacementList: AuroraLedPlacement[]): AuroraResolvedPlacement[] {
    return climbPlacementList.flatMap((climbPlacement) => {
      const color = climbPlacement.color?.trim() ?? ""

      if (color === "") {
        return []
      }

      return [
        {
          position: climbPlacement.position,
          colorHex: this.normalizeColor(color),
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
   * @param climbPlacementList - The list of climb placements containing position and color.
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
   * @param climbPlacementList - The list of climb placements containing position and color.
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
    const characteristic = this.services
      .find((service) => service.id === "uart")
      ?.characteristics.find((char) => char.id === "tx")?.characteristic

    if (!characteristic) {
      throw new Error('Characteristic "tx" not found in service "uart"')
    }

    for (let index = 0; index < messages.length; index += 1) {
      const message = messages[index]
      if (!message) {
        continue
      }

      await this.writeMessageChunk(characteristic, message, index === messages.length - 1)
    }
  }

  private async writeMessageChunk(
    characteristic: BluetoothRemoteGATTCharacteristic,
    message: Uint8Array,
    isLastChunk: boolean,
  ): Promise<void> {
    this.updateTimestamp()
    const valueToWrite = new Uint8Array(message)

    if (!isLastChunk && this.canWriteWithoutResponse(characteristic)) {
      await characteristic.writeValueWithoutResponse(valueToWrite)
    } else {
      await characteristic.writeValue(valueToWrite)
    }

    this.writeLast = message
  }

  private canWriteWithoutResponse(characteristic: BluetoothRemoteGATTCharacteristic): boolean {
    return (
      characteristic.properties.writeWithoutResponse !== false &&
      typeof characteristic.writeValueWithoutResponse === "function"
    )
  }

  /**
   * Configures the LEDs based on an array of climb placements.
   * @param config - Array of climb placements for the LEDs. Each placement must include a color hex string.
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
 * Aurora Board
 * {@link https://auroraboardapp.com}
 */
export class AuroraBoard extends Aurora implements IAurora {}
