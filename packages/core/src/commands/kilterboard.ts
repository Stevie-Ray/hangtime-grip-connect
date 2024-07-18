/**
 * For API level 2 and API level 3.
 * The first byte in the data is dependent on where the packet is in the message as a whole.
 * More details: https://github.com/1-max-1/fake_kilter_board
 */
export enum KilterBoardPacket {
  /** If this packet is in the middle, the byte gets set to 77 (M). */
  V2_MIDDLE = 77,
  /** If this packet is the first packet in the message, then this byte gets set to 78 (N). */
  V2_FIRST,
  /** If this is the last packet in the message, this byte gets set to 79 (0). */
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
