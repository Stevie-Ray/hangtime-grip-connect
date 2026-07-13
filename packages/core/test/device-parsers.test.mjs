import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  Climbro,
  CTS500,
  Entralpi,
  ForceBoard,
  FrezDyno,
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
  frezRawWeightPacket,
  int16LePacket,
  muteConsole,
  offsetDataView,
  progressorWeightPacket,
  textView,
  uint32BePacket,
  uint32LePacket,
} from "./helpers.mjs"

function segmentPullupTrace(points, startMs, endMs, startForce, endForce, stepMs = 40) {
  const duration = Math.max(stepMs, endMs - startMs)
  for (let elapsedMs = startMs; elapsedMs <= endMs; elapsedMs += stepMs) {
    const progress = Math.min(1, Math.max(0, (elapsedMs - startMs) / duration))
    const eased = 0.5 - Math.cos(progress * Math.PI) / 2
    const ripple = Math.sin(elapsedMs / 61) * 0.6
    points.push({ elapsedMs, force: startForce + (endForce - startForce) * eased + ripple })
  }
}

function threeRepPullupTrace({ unloadTail = true } = {}) {
  const points = []
  segmentPullupTrace(points, 0, 2000, 2, 2)
  segmentPullupTrace(points, 2000, 3500, 2, 105)
  segmentPullupTrace(points, 3500, 4700, 105, 58)
  segmentPullupTrace(points, 4700, 6200, 58, 112)
  segmentPullupTrace(points, 6200, 7400, 112, 60)
  segmentPullupTrace(points, 7400, 9000, 60, 108)
  if (unloadTail) {
    segmentPullupTrace(points, 9000, 10300, 108, 2)
    segmentPullupTrace(points, 10300, 11600, 2, 2)
  } else {
    segmentPullupTrace(points, 9000, 9950, 108, 72)
  }
  return points
}

function motherboardPacket(sampleIndex, force) {
  const bytes = new Uint8Array(16)
  const view = new DataView(bytes.buffer)
  view.setUint16(0, sampleIndex, true)
  view.setUint16(2, 0x012c, true)
  view.setUint8(13, 0)
  view.setUint8(14, 0)
  view.setUint8(15, 0)
  setInt24Le(bytes, 4, Math.round(force))
  setInt24Le(bytes, 7, 0)
  setInt24Le(bytes, 10, 0)
  return `${Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0"))
    .join("")
    .toUpperCase()}\n`
}

function setInt24Le(bytes, offset, value) {
  let raw = value
  if (raw < 0) raw += 0x1000000
  bytes[offset] = raw & 0xff
  bytes[offset + 1] = (raw >> 8) & 0xff
  bytes[offset + 2] = (raw >> 16) & 0xff
}

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

  it("parses Frez Dyno float weight packets and device-timestamp sampling rate", () => {
    const device = new FrezDyno({ packetFormat: "float" })
    const notifications = captureNotifications(device)

    device.handleNotifications(
      progressorWeightPacket([
        { weight: 8, timestampUs: 1 },
        { weight: 9.5, timestampUs: 250 },
      ]),
    )

    assert.equal(notifications.length, 2)
    assert.equal(notifications[0].current, 8)
    assert.equal(notifications[1].current, 9.5)
    assert.equal(notifications[1].peak, 9.5)
    assert.equal(notifications[1].mean, 8.75)
    assert.equal(notifications[1].min, 8)
    assert.equal(notifications[1].performance.packetIndex, 1)
    assert.equal(notifications[1].performance.sampleIndex, 2)
    assert.equal(notifications[1].performance.samplesPerPacket, 2)
    assert.equal(notifications[1].performance.samplingRateHz, 2)
  })

  it("parses Frez Dyno raw weight packets with calibration", () => {
    const device = new FrezDyno({
      calibrationPoints: [
        { raw: 1000, weight: 0 },
        { raw: 3000, weight: 20 },
      ],
    })
    const notifications = captureNotifications(device)

    device.handleNotifications(
      frezRawWeightPacket([
        { raw: 1500, timestampUs: 1 },
        { raw: 2500, timestampUs: 250 },
      ]),
    )

    assert.equal(notifications.length, 2)
    assert.equal(notifications[0].current, 5)
    assert.equal(notifications[1].current, 15)
    assert.equal(notifications[1].peak, 15)
    assert.equal(notifications[1].mean, 10)
    assert.equal(notifications[1].min, 5)
    assert.equal(notifications[1].performance.packetIndex, 1)
    assert.equal(notifications[1].performance.sampleIndex, 2)
    assert.equal(notifications[1].performance.samplesPerPacket, 2)
    assert.equal(notifications[1].performance.samplingRateHz, 2)
  })

  it("ignores Frez Dyno data without the app's two-byte measurement header", () => {
    const device = new FrezDyno({
      calibrationPoints: [
        { raw: 1000, weight: 0 },
        { raw: 3000, weight: 20 },
      ],
    })
    const notifications = captureNotifications(device)

    device.handleNotifications(uint32LePacket([1500, 2500]))

    assert.equal(notifications.length, 0)
  })

  it("fails clearly when Frez Dyno raw packets arrive without calibration", () => {
    const device = new FrezDyno()
    const notifications = captureNotifications(device)

    assert.throws(() => {
      device.handleNotifications(frezRawWeightPacket([{ raw: 1500, timestampUs: 1000 }]))
    }, /raw sensor data/)
    assert.equal(notifications.length, 0)
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

  it("ignores non-measurement Frez Dyno notifications", () => {
    const device = new FrezDyno()
    const responses = []

    device.writeCallback = (response) => {
      responses.push(response)
    }

    device.handleNotifications(dataView([0, 4, 0x34, 0x12, 0, 0]))

    assert.deepEqual(responses, [])
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

  it("runs Motherboard pull-up callbacks from live force packets", (t) => {
    const device = new Motherboard()
    const notifications = captureNotifications(device)
    const pullups = []
    const trace = threeRepPullupTrace()
    const startedAt = 1_000_000
    let now = startedAt

    t.mock.method(Date, "now", () => now)

    device.calibrationData = [
      [
        [0, 0, 0],
        [1, 1000, 1000],
      ],
      [
        [0, 0, 0],
        [1, 1000, 1000],
      ],
      [
        [0, 0, 0],
        [1, 1000, 1000],
      ],
      [
        [0, 0, 0],
        [1, 1000, 1000],
      ],
    ]

    device.pullup((index) => {
      pullups.push(index)
    })

    trace.forEach((sample, index) => {
      now = startedAt + sample.elapsedMs
      device.handleNotifications(textView(motherboardPacket(index + 1, sample.force)))
    })

    assert.equal(pullups.length, 3)
    assert.deepEqual(pullups, [1, 2, 3])
    assert.equal(notifications.length, trace.length)
  })

  it("finalizes a pending Motherboard pull-up callback when streaming stops", async (t) => {
    const device = new Motherboard()
    captureNotifications(device)
    const pullups = []
    const trace = threeRepPullupTrace({ unloadTail: false })
    const writes = []
    const startedAt = 2_000_000
    let now = startedAt

    t.mock.method(Date, "now", () => now)

    device.calibrationData = [
      [
        [0, 0, 0],
        [1, 1000, 1000],
      ],
      [
        [0, 0, 0],
        [1, 1000, 1000],
      ],
      [
        [0, 0, 0],
        [1, 1000, 1000],
      ],
      [
        [0, 0, 0],
        [1, 1000, 1000],
      ],
    ]

    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }
    device.pullup((index) => {
      pullups.push(index)
    })

    trace.forEach((sample, index) => {
      now = startedAt + sample.elapsedMs
      device.handleNotifications(textView(motherboardPacket(index + 1, sample.force)))
    })

    assert.equal(pullups.length, 2)

    await device.stop()

    assert.deepEqual(writes, [device.commands.STOP_WEIGHT_MEAS])
    assert.deepEqual(pullups, [1, 2, 3])
  })
})
