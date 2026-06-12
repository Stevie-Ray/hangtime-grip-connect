import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  Climbro,
  CTS500,
  Entralpi,
  ForceBoard,
  Motherboard,
  PB700BT,
  Progressor,
  SmartBoardPro,
} from "../dist/index.js"
import {
  assertAlmostEqual,
  captureNotifications,
  cts500Frame,
  cts500WeightFrameBytes,
  dataView,
  forceBoardPacket,
  int16LePacket,
  muteConsole,
  offsetDataView,
  progressorWeightPacket,
  textView,
  uint32BePacket,
} from "./helpers.mjs"

describe("device notification parsers", () => {
  it("parses Climbro battery and sensor packets", async () => {
    const device = new Climbro()
    const notifications = captureNotifications(device)

    device.handleNotifications(dataView([0xf0, 112, 0xf5, 10, 0xf6, 20]))

    assert.equal(await device.battery(), "0")
    assert.equal(notifications.length, 3)
    assert.equal(notifications[0].current, 10)
    assert.equal(notifications[1].current, 36)
    assert.equal(notifications[2].current, 20)
    assert.equal(notifications[2].peak, 36)
    assert.equal(notifications[2].mean, 22)
    assert.equal(notifications[2].min, 10)
    assert.equal(notifications[2].performance.packetIndex, 1)
    assert.equal(notifications[2].performance.sampleIndex, 3)
    assert.equal(notifications[2].performance.samplesPerPacket, 3)
  })

  it("parses Climbro packets from DataView slices without reading prefix bytes", () => {
    const device = new Climbro()
    const notifications = captureNotifications(device)

    device.handleNotifications(offsetDataView([0xf5, 10], [0xf5, 99]))

    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].current, 10)
  })

  it("parses Entralpi weight notifications", () => {
    const device = new Entralpi()
    const notifications = captureNotifications(device)

    device.handleNotifications(dataView([0x04, 0xce]))

    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].unit, "kg")
    assert.equal(notifications[0].current, 12.3)
    assert.equal(notifications[0].peak, 12.3)
    assert.equal(notifications[0].mean, 12.3)
    assert.equal(notifications[0].min, 12.3)
    assert.equal(notifications[0].performance.packetIndex, 1)
    assert.equal(notifications[0].performance.sampleIndex, 1)
    assert.equal(notifications[0].performance.samplesPerPacket, 1)
  })

  it("parses ForceBoard multi-sample packets in pounds", () => {
    const device = new ForceBoard()
    const notifications = captureNotifications(device, "lbs")

    device.handleNotifications(forceBoardPacket([1000, 1200]))

    assert.equal(notifications.length, 2)
    assert.equal(notifications[0].current, 1000)
    assert.equal(notifications[1].current, 1200)
    assert.equal(notifications[1].peak, 1200)
    assert.equal(notifications[1].mean, 1100)
    assert.equal(notifications[1].min, 1000)
    assert.equal(notifications[1].performance.packetIndex, 1)
    assert.equal(notifications[1].performance.sampleIndex, 2)
    assert.equal(notifications[1].performance.samplesPerPacket, 2)
  })

  it("parses ForceBoard packets from DataView slices without reading prefix bytes", () => {
    const device = new ForceBoard()
    const notifications = captureNotifications(device, "lbs")

    device.handleNotifications(offsetDataView(forceBoardPacket([42]), [99, 99]))

    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].current, 42)
  })

  it("parses SmartBoard Pro little-endian samples", (t) => {
    muteConsole(t)

    const device = new SmartBoardPro()
    const notifications = captureNotifications(device)

    device.handleNotifications(int16LePacket([100, 150]))

    assert.equal(notifications.length, 2)
    assert.equal(notifications[0].current, 100)
    assert.equal(notifications[1].current, 150)
    assert.equal(notifications[1].peak, 150)
    assert.equal(notifications[1].mean, 125)
    assert.equal(notifications[1].min, 100)
    assert.equal(notifications[1].performance.packetIndex, 1)
    assert.equal(notifications[1].performance.samplesPerPacket, 2)
  })

  it("parses Progressor weight packets and device-timestamp sampling rate", () => {
    const device = new Progressor()
    const notifications = captureNotifications(device)

    device.handleNotifications(
      progressorWeightPacket([
        { weight: 10, timestampUs: 1000 },
        { weight: 12.5, timestampUs: 500000 },
      ]),
    )

    assert.equal(notifications.length, 2)
    assert.equal(notifications[0].current, 10)
    assert.equal(notifications[1].current, 12.5)
    assert.equal(notifications[1].peak, 12.5)
    assert.equal(notifications[1].mean, 11.25)
    assert.equal(notifications[1].min, 10)
    assert.equal(notifications[1].performance.packetIndex, 1)
    assert.equal(notifications[1].performance.sampleIndex, 2)
    assert.equal(notifications[1].performance.samplesPerPacket, 2)
    assert.equal(notifications[1].performance.samplingRateHz, 2)
  })

  it("routes Progressor command responses through the write callback", () => {
    const device = new Progressor()
    const responses = []

    device.writeLast = device.commands.GET_PROGRESSOR_ID
    device.writeCallback = (response) => {
      responses.push(response)
    }

    device.handleNotifications(dataView([0, 3, 0x01, 0x02, 0x03]))

    assert.deepEqual(responses, ["030201"])
  })

  it("parses CTS500 fragmented weight frames and ignores invalid checksums", () => {
    const device = new CTS500()
    const notifications = captureNotifications(device)
    const frame = cts500WeightFrameBytes(12.34)

    device.handleNotifications(dataView(frame.slice(0, 3)))
    assert.equal(notifications.length, 0)

    device.handleNotifications(dataView(frame.slice(3)))
    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].current, 12.34)
    assert.equal(notifications[0].peak, 12.34)
    assert.equal(notifications[0].mean, 12.34)
    assert.equal(notifications[0].min, 12.34)
    assert.equal(notifications[0].performance.packetIndex, 1)
    assert.equal(notifications[0].performance.sampleIndex, 1)
    assert.equal(notifications[0].performance.samplesPerPacket, 1)

    const invalidFrame = cts500WeightFrameBytes(20)
    invalidFrame[invalidFrame.length - 1] ^= 0xff
    device.handleNotifications(dataView(invalidFrame))

    assert.equal(notifications.length, 1)
  })

  it("routes CTS500 command responses through the write callback", () => {
    const device = new CTS500()
    const responses = []

    device.writeCallback = (response) => {
      responses.push(response)
    }

    device.handleNotifications(cts500Frame([0x05, 0x80, 0xc4, 0x00, 0x01, 0x63]))

    assert.deepEqual(responses, ["3.55"])
  })

  it("parses PB-700BT RPM notifications", () => {
    const device = new PB700BT()
    const notifications = captureNotifications(device)

    device.handleNotifications(uint32BePacket([4000, 42]))

    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].current, 10000)
    assert.equal(notifications[0].peak, 10000)
    assert.equal(notifications[0].mean, 10000)
    assert.equal(notifications[0].min, 10000)
    assert.equal(notifications[0].performance.packetIndex, 1)
    assert.equal(notifications[0].performance.sampleIndex, 1)
  })

  it("parses Motherboard calibrated distribution packets", () => {
    const device = new Motherboard()
    const notifications = captureNotifications(device)

    device.calibrationData = [
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
    ]

    device.handleNotifications(textView("01002C010A0000ECFFFFE2FFFF000000\n"))

    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].current, 60)
    assert.equal(notifications[0].peak, 60)
    assert.equal(notifications[0].mean, 60)
    assert.equal(notifications[0].min, 60)
    assert.equal(notifications[0].performance.packetIndex, 1)
    assert.equal(notifications[0].performance.sampleIndex, 1)
    assert.equal(notifications[0].performance.samplesPerPacket, 3)

    assertAlmostEqual(notifications[0].distribution.left.current, 10)
    assertAlmostEqual(notifications[0].distribution.center.current, 20)
    assertAlmostEqual(notifications[0].distribution.right.current, 30)
  })

  it("tracks Motherboard per-zone session minimums across packets", () => {
    const device = new Motherboard()
    const notifications = captureNotifications(device)

    device.calibrationData = [
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
    ]

    // left: 10 -> 5 -> 20, center: 20 -> 10 -> 40, right: 30 -> 15 -> 60
    device.handleNotifications(textView("01002C010A0000ECFFFFE2FFFF000000\n"))
    device.handleNotifications(textView("02002C01050000F6FFFFF1FFFF000000\n"))
    device.handleNotifications(textView("03002C01140000D8FFFFC4FFFF000000\n"))

    assert.equal(notifications.length, 3)
    const left = notifications[2].distribution.left
    assertAlmostEqual(left.current, 20)
    assertAlmostEqual(left.peak, 20)
    // The minimum was seen in the second packet, not the latest one
    assertAlmostEqual(left.min, 5)
    assertAlmostEqual(left.mean, (10 + 5 + 20) / 3)

    const center = notifications[2].distribution.center
    assertAlmostEqual(center.peak, 40)
    assertAlmostEqual(center.min, 10)
  })

  it("resets Motherboard session stats when a new stream starts", async () => {
    const device = new Motherboard()
    const notifications = captureNotifications(device)

    device.calibrationData = [
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
      [
        [0, 0, 0],
        [1, 100, 100],
      ],
    ]

    device.handleNotifications(textView("01002C01140000D8FFFFC4FFFF000000\n"))
    assert.equal(notifications[0].peak, 120)

    // Start a new streaming session without reconnecting
    device.write = async () => undefined
    await device.stream()

    device.handleNotifications(textView("01002C010A0000ECFFFFE2FFFF000000\n"))

    const measurement = notifications[1]
    // Stats from the previous session must not leak into the new one
    assert.equal(measurement.current, 60)
    assert.equal(measurement.peak, 60)
    assert.equal(measurement.mean, 60)
    assert.equal(measurement.min, 60)
    assertAlmostEqual(measurement.distribution.left.peak, 10)
    assertAlmostEqual(measurement.distribution.left.min, 10)
  })
})
