import assert from "node:assert/strict"
import { describe, it } from "node:test"

import { AuroraBoard } from "../dist/index.js"

describe("Aurora LED payloads", () => {
  it("builds API level 2 payloads by default", async () => {
    const board = new AuroraBoard()

    const payload = await board.led([{ position: 513, color: "#ffffff" }])

    assert.deepEqual(payload, [1, 3, 176, 2, 80, 1, 254, 3])
  })

  it("builds payloads from Kilter Board device name API suffixes", async () => {
    const cases = [
      {
        name: "kilterboard#2353@3",
        expectedPayload: [1, 4, 169, 2, 84, 1, 2, 255, 3],
      },
      {
        name: "kilterboard@2",
        expectedPayload: [1, 3, 176, 2, 80, 1, 254, 3],
      },
      {
        name: "kilterboard",
        expectedPayload: [1, 3, 176, 2, 80, 1, 254, 3],
      },
      {
        name: "kilterboard#83727",
        expectedPayload: [1, 3, 176, 2, 80, 1, 254, 3],
      },
    ]

    for (const { name, expectedPayload } of cases) {
      const board = new AuroraBoard()
      board.setApiLevelFromDeviceName(name)

      const payload = await board.led([{ position: 513, color: "ffffff" }])

      assert.deepEqual(payload, expectedPayload)
    }
  })

  it("rejects invalid colors and LED positions", async () => {
    const board = new AuroraBoard()

    await assert.rejects(() => board.led([{ position: 1, color: "blue" }]), /Invalid Aurora Board LED color/)
    await assert.rejects(() => board.led([{ position: 1024, color: "#ffffff" }]), /requires an integer LED position/)
  })

  it("splits API level 2 payloads into 260-byte max packets with first and last markers", async () => {
    const board = new AuroraBoard()
    const placements = Array.from({ length: 128 }, (_, position) => ({
      position,
      color: "#ffffff",
    }))

    const payload = await board.led(placements)
    const firstPacket = payload.slice(0, 260)
    const lastPacket = payload.slice(260)

    assert.equal(firstPacket.length, 260)
    assert.equal(firstPacket[0], 1)
    assert.equal(firstPacket[1], 255)
    assert.equal(firstPacket[2], checksum(firstPacket.slice(4, -1)))
    assert.equal(firstPacket[3], 2)
    assert.equal(firstPacket[4], 78)
    assert.equal(firstPacket[259], 3)

    assert.deepEqual(lastPacket, [1, 3, checksum([79, 127, 252]), 2, 79, 127, 252, 3])
  })

  it("writes connected board payloads in 20-byte BLE chunks", async () => {
    const board = new AuroraBoard()
    const writes = []

    board.isConnected = () => true
    board.services[0].characteristics[0].characteristic = {
      properties: {
        write: true,
      },
      writeValueWithoutResponse: async (value) => {
        writes.push({ mode: "without-response", value: [...value] })
      },
      writeValueWithResponse: async (value) => {
        throw new Error(`writeValueWithResponse should not be used for Aurora chunks: ${[...value].join(",")}`)
      },
      writeValue: async (value) => {
        throw new Error(
          `writeValue should not be used when writeValueWithoutResponse is available: ${[...value].join(",")}`,
        )
      },
    }

    const payload = await board.led(
      Array.from({ length: 20 }, (_, position) => ({
        position,
        color: "#ffffff",
      })),
    )

    assert.ok(writes.length > 1)
    assert.ok(writes.every((write) => write.value.length <= 20))
    assert.ok(writes.every((write) => write.mode === "without-response"))
    assert.deepEqual(
      writes.flatMap((write) => write.value),
      payload,
    )
  })

  it("serializes concurrent connected board writes", async () => {
    const board = new AuroraBoard()
    const writes = []
    let activeWrites = 0
    let maxActiveWrites = 0

    const write = async (value) => {
      activeWrites += 1
      maxActiveWrites = Math.max(maxActiveWrites, activeWrites)

      if (activeWrites > 1) {
        throw new Error("GATT operation already in progress.")
      }

      await delay(5)
      writes.push([...value])
      activeWrites -= 1
    }

    board.isConnected = () => true
    board.services[0].characteristics[0].characteristic = {
      properties: {
        write: true,
      },
      writeValueWithoutResponse: write,
      writeValue: write,
    }

    const [firstPayload, secondPayload] = await Promise.all([
      board.led([{ position: 1, color: "#ffffff" }]),
      board.led([{ position: 2, color: "#ffffff" }]),
    ])

    assert.equal(maxActiveWrites, 1)
    assert.deepEqual(writes, [firstPayload, secondPayload])
  })

  it("falls back to writeValue when writeValueWithoutResponse is unavailable", async () => {
    const board = new AuroraBoard()
    const writes = []

    board.isConnected = () => true
    board.services[0].characteristics[0].characteristic = {
      properties: {
        writeWithoutResponse: false,
        write: true,
      },
      writeValueWithoutResponse: async (value) => {
        throw new Error(`writeValueWithoutResponse should not be used: ${[...value].join(",")}`)
      },
      writeValue: async (value) => {
        writes.push([...value])
      },
    }

    const payload = await board.led([{ position: 1, color: "#ffffff" }])

    assert.deepEqual(writes, [payload])
  })

  it("still returns payloads when a connected board is missing the UART tx characteristic", async () => {
    const board = new AuroraBoard()

    board.isConnected = () => true

    const payload = await board.led([{ position: 513, color: "#ffffff" }])

    assert.deepEqual(payload, [1, 3, 176, 2, 80, 1, 254, 3])
  })
})

function checksum(bytes) {
  return bytes.reduce((sum, byte) => (sum + byte) & 255, 0) ^ 255
}

function delay(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms)
  })
}
