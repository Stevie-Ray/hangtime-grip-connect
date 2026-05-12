import assert from "node:assert/strict"

export function assertAlmostEqual(actual, expected, epsilon = 1e-9) {
  assert.ok(Math.abs(actual - expected) <= epsilon, `Expected ${actual} to be within ${epsilon} of ${expected}`)
}

export function dataView(bytes) {
  const array = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes)
  return new DataView(array.buffer, array.byteOffset, array.byteLength)
}

export function textView(text) {
  return dataView(new TextEncoder().encode(text))
}

export function captureNotifications(device, unit = "kg") {
  const notifications = []
  device.notify((measurement) => {
    notifications.push(measurement)
  }, unit)
  device.activityCheck = async () => undefined
  device.writeCallback = () => undefined
  return notifications
}

export function muteConsole(t) {
  for (const method of ["error", "log", "warn"]) {
    t.mock.method(console, method, () => undefined)
  }
}

export function cts500Frame(bytesWithoutChecksum) {
  return dataView(cts500FrameBytes(bytesWithoutChecksum))
}

export function cts500FrameBytes(bytesWithoutChecksum) {
  return Uint8Array.from([...bytesWithoutChecksum, checksum(bytesWithoutChecksum)])
}

export function cts500WeightFrame(weight) {
  return dataView(cts500WeightFrameBytes(weight))
}

export function cts500WeightFrameBytes(weight) {
  const rawWeight = Math.round(weight * 100)
  return cts500FrameBytes([
    0x05,
    0x01,
    (rawWeight >>> 24) & 0xff,
    (rawWeight >>> 16) & 0xff,
    (rawWeight >>> 8) & 0xff,
    rawWeight & 0xff,
  ])
}

export function forceBoardPacket(samples) {
  const bytes = new Uint8Array(2 + samples.length * 3)
  bytes[0] = (samples.length >>> 8) & 0xff
  bytes[1] = samples.length & 0xff

  samples.forEach((sample, index) => {
    const offset = 2 + index * 3
    bytes[offset] = Math.floor(sample / 32768) & 0xff
    bytes[offset + 1] = Math.floor((sample % 32768) / 256) & 0xff
    bytes[offset + 2] = sample & 0xff
  })

  return dataView(bytes)
}

export function progressorWeightPacket(samples) {
  const bytes = new Uint8Array(2 + samples.length * 8)
  bytes[0] = 1
  bytes[1] = samples.length * 8
  const view = new DataView(bytes.buffer)

  samples.forEach(({ weight, timestampUs }, index) => {
    const offset = 2 + index * 8
    view.setFloat32(offset, weight, true)
    view.setUint32(offset + 4, timestampUs, true)
  })

  return view
}

export function int16LePacket(values) {
  const bytes = new Uint8Array(values.length * 2)
  const view = new DataView(bytes.buffer)

  values.forEach((value, index) => {
    view.setInt16(index * 2, value, true)
  })

  return view
}

export function uint32BePacket(values) {
  const bytes = new Uint8Array(values.length * 4)
  const view = new DataView(bytes.buffer)

  values.forEach((value, index) => {
    view.setUint32(index * 4, value, false)
  })

  return view
}

function checksum(bytes) {
  return bytes.reduce((sum, byte) => (sum + byte) & 0xff, 0)
}
