### Basic Usage

```ts
import { KilterBoard } from "@hangtime/grip-connect"

const device = new KilterBoard()
```

### Device features

See [Devices](/devices/) for default device features.

```ts
   /**
   * Calculates the checksum for a byte array.
   * @param data - The array of bytes to calculate the checksum for.
   * @returns The calculated checksum value.
   */
  checksum(data: number[]): number

  /**
   * Wraps a byte array with header and footer bytes for transmission.
   * @param data - The array of bytes to wrap.
   * @returns The wrapped byte array.
   */
  wrapBytes(data: number[]): number[]

  /**
   * Encodes a position into a byte array.
   * @param position - The position to encode.
   * @returns The encoded byte array representing the position.
   */
  encodePosition(position: number): number[]

  /**
   * Encodes a color string into a numeric representation.
   * @param color - The color string in hexadecimal format.
   * @returns The encoded/compressed color value.
   */
  encodeColor(color: string): number

  /**
   * Encodes a placement into a byte array.
   * @param position - The position to encode.
   * @param ledColor - The color of the LED in hexadecimal format.
   * @returns The encoded byte array representing the placement.
   */
  encodePlacement(position: number, ledColor: string): number[]

  /**
   * Prepares byte arrays for transmission based on a list of climb placements.
   * @param climbPlacementList - The list of climb placements.
   * @returns The final byte array ready for transmission.
   */
  prepBytesV3(climbPlacementList: ClimbPlacement[]): number[]

  /**
   * Splits a collection into slices of the specified length.
   * @param n - Number of elements per slice.
   * @param list - Array to be sliced.
   * @returns The sliced array.
   */
  splitEvery(n: number, list: number[]): number[][]

  /**
   * Splits a message into 20-byte chunks for Bluetooth transmission.
   * @param buffer - The message to split.
   * @returns The array of Uint8Arrays.
   */
  splitMessages(buffer: number[]): Uint8Array[]

  /**
   * Sends a series of messages to the device.
   * @param messages - Array of Uint8Arrays to send.
   */
  writeMessageSeries(messages: Uint8Array[]): Promise<void>

  /**
   * Configures the LEDs based on an array of climb placements.
   * @param config - Optional color or array of climb placements.
   * @returns The prepared payload or undefined.
   */
  led(config?: ClimbPlacement[]): Promise<number[] | undefined>
```
