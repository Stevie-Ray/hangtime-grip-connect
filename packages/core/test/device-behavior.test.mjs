import assert from "node:assert/strict"
import { setTimeout as delay } from "node:timers/promises"
import { describe, it } from "node:test"

import { CTS500, ForceBoard, FrezDyno, lookupFrezDynoRemoteCalibration } from "../dist/index.js"
import { captureNotifications, frezRawWeightPacket } from "./helpers.mjs"

describe("device behavior", () => {
  it("requires activity to remain above or below threshold for the configured duration", async () => {
    const device = new ForceBoard()
    const states = []

    device.active(
      (active) => {
        states.push(active)
      },
      { threshold: 5, duration: 20 },
    )

    void device.activityCheck(10)
    await delay(5)
    await device.activityCheck(0)
    await delay(25)

    assert.deepEqual(states, [])

    void device.activityCheck(10)
    await delay(25)

    assert.deepEqual(states, [true])

    void device.activityCheck(0)
    await delay(25)

    assert.deepEqual(states, [true, false])
  })

  it("stops ForceBoard finite-duration streams", async () => {
    const device = new ForceBoard()
    const writes = []

    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }

    await device.stream(10)

    assert.deepEqual(writes, [device.commands.START_WEIGHT_MEAS, device.commands.STOP_WEIGHT_MEAS])
  })

  it("stops Frez Dyno finite-duration streams", async () => {
    const device = new FrezDyno({
      calibrationPoints: [
        { raw: 1000, weight: 0 },
        { raw: 2000, weight: 10 },
      ],
    })
    const writes = []

    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }

    await device.stream(10)

    assert.deepEqual(writes, [device.commands.START_WEIGHT_MEAS, device.commands.STOP_WEIGHT_MEAS])
  })

  it("requires Frez Dyno calibration before default raw streaming", async () => {
    const device = new FrezDyno({ calibrationLookup: null })
    const writes = []

    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }

    await assert.rejects(device.stream(), /without calibration data/)
    assert.deepEqual(writes, [])
  })

  it("requires a serial or remote ID for the Frez Dyno calibration RPC", async () => {
    const originalFetch = globalThis.fetch
    const requestBodies = []

    globalThis.fetch = async (_url, init) => {
      requestBodies.push(JSON.parse(init.body))
      return new Response("null", {
        status: 200,
        headers: { "content-type": "application/json" },
      })
    }

    try {
      assert.equal(await lookupFrezDynoRemoteCalibration({ deviceName: "FrezDyno-002318" }), null)
      assert.equal(await lookupFrezDynoRemoteCalibration({ deviceSerialNumber: "002318" }), null)
      assert.deepEqual(requestBodies, [
        {
          p_device_name: "FrezDyno",
          p_device_serial_number: "002318",
        },
      ])
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("parses the Frez app's targetWeight and adcValue calibration fields", async () => {
    const originalFetch = globalThis.fetch

    globalThis.fetch = async () =>
      new Response(
        JSON.stringify({
          calibration_points: [
            { targetWeight: 0, adcValue: 1000 },
            { targetWeight: 10, adcValue: 2000 },
          ],
        }),
        {
          status: 200,
          headers: { "content-type": "application/json" },
        },
      )

    try {
      assert.deepEqual(await lookupFrezDynoRemoteCalibration({ deviceSerialNumber: "002318" }), [
        { raw: 1000, weight: 0 },
        { raw: 2000, weight: 10 },
      ])
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("tries Frez serial before Bluetooth remote ID like the native app", async () => {
    const originalFetch = globalThis.fetch
    const requestBodies = []

    globalThis.fetch = async (_url, init) => {
      const body = JSON.parse(init.body)
      requestBodies.push(body)
      const responseBody =
        body.p_device_serial_number === "remote-id"
          ? {
              calibration_points: [
                { targetWeight: 0, adcValue: 1000 },
                { targetWeight: 10, adcValue: 2000 },
              ],
            }
          : null
      return Response.json(responseBody)
    }

    try {
      assert.deepEqual(
        await lookupFrezDynoRemoteCalibration({
          deviceId: "remote-id",
          deviceName: "FrezDyno-002318",
          deviceSerialNumber: "actual-serial",
        }),
        [
          { raw: 1000, weight: 0 },
          { raw: 2000, weight: 10 },
        ],
      )
      assert.deepEqual(requestBodies, [
        {
          p_device_name: "FrezDyno-002318",
          p_device_serial_number: "actual-serial",
        },
        {
          p_device_name: "FrezDyno-002318",
          p_device_serial_number: "remote-id",
        },
      ])
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("loads Frez Dyno calibration before streaming", async () => {
    const lookupCalls = []
    const device = new FrezDyno({
      calibrationLookup: async (params) => {
        lookupCalls.push(params)
        return [
          { raw: 1000, weight: 0 },
          { raw: 2000, weight: 10 },
        ]
      },
    })
    const notifications = captureNotifications(device)
    const writes = []

    device.bluetooth = { name: "Frez Dyno 123" }
    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }

    await device.stream()
    device.handleNotifications(frezRawWeightPacket([{ raw: 1500, timestampUs: 1000 }]))

    assert.deepEqual(lookupCalls, [{ deviceName: "Frez Dyno 123" }])
    assert.deepEqual(writes, [device.commands.START_WEIGHT_MEAS])
    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].current, 5)
  })

  it("uses Frez Dyno serial for calibration lookup before streaming", async () => {
    const lookupCalls = []
    const reads = []
    const writes = []
    const device = new FrezDyno({
      calibrationLookup: async (params) => {
        lookupCalls.push(params)
        return [
          { raw: 1000, weight: 0 },
          { raw: 2000, weight: 10 },
        ]
      },
    })

    device.bluetooth = { id: "opaque-device-id", name: "Frez Dyno 123", gatt: { connected: true } }
    device.read = async (serviceId, characteristicId, duration) => {
      reads.push([serviceId, characteristicId, duration])
      return "SER123"
    }
    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }

    await device.stream()

    assert.deepEqual(reads, [["device", "serial", 250]])
    assert.deepEqual(lookupCalls, [
      { deviceId: "opaque-device-id", deviceName: "Frez Dyno 123", deviceSerialNumber: "SER123" },
    ])
    assert.deepEqual(writes, [device.commands.START_WEIGHT_MEAS])
  })

  it("lets native transports provide Frez Dyno calibration identifiers", async () => {
    const lookupCalls = []

    class NativeFrezDyno extends FrezDyno {
      canReadDeviceSerial() {
        return true
      }

      getCalibrationDeviceId() {
        return "native-device-id"
      }

      getCalibrationDeviceName() {
        return "FrezDyno Native"
      }
    }

    const device = new NativeFrezDyno({
      calibrationLookup: async (params) => {
        lookupCalls.push(params)
        return [
          { raw: 1000, weight: 0 },
          { raw: 2000, weight: 10 },
        ]
      },
    })
    device.read = async () => "NATIVE-SERIAL"
    device.write = async () => undefined

    await device.stream()

    assert.deepEqual(lookupCalls, [
      {
        deviceId: "native-device-id",
        deviceName: "FrezDyno Native",
        deviceSerialNumber: "NATIVE-SERIAL",
      },
    ])
  })

  it("does not treat the advertised Frez Dyno name suffix as its serial", async () => {
    const lookupCalls = []
    const device = new FrezDyno({
      calibrationLookup: async (params) => {
        lookupCalls.push(params)
        return [
          { raw: 1000, weight: 0 },
          { raw: 2000, weight: 10 },
        ]
      },
    })

    device.bluetooth = { id: "opaque-device-id", name: "FrezDyno-002318", gatt: { connected: true } }
    device.read = async () => {
      throw new Error('Characteristic "serial" not found in service "device"')
    }
    device.write = async () => undefined

    assert.equal(await device.serial(), undefined)
    await device.stream()

    assert.deepEqual(lookupCalls, [{ deviceId: "opaque-device-id", deviceName: "FrezDyno-002318" }])
  })

  it("uses an explicit Frez Dyno serial override for calibration lookup", async () => {
    const lookupCalls = []
    const device = new FrezDyno({
      calibrationLookup: async (params) => {
        lookupCalls.push(params)
        return [
          { raw: 1000, weight: 0 },
          { raw: 2000, weight: 10 },
        ]
      },
    })

    device.bluetooth = { id: "opaque-device-id", name: "FrezDyno-002318", gatt: { connected: true } }
    device.read = async () => {
      throw new Error('Characteristic "serial" not found in service "device"')
    }
    device.write = async () => undefined
    device.setDeviceSerialNumber(" actual-serial ")

    assert.equal(await device.serial(), "actual-serial")
    await device.stream()
    assert.deepEqual(lookupCalls, [
      {
        deviceId: "opaque-device-id",
        deviceName: "FrezDyno-002318",
        deviceSerialNumber: "actual-serial",
      },
    ])
  })

  it("reloads factory calibration when the Frez Dyno serial changes", async () => {
    const lookupCalls = []
    const device = new FrezDyno({
      deviceSerialNumber: "SERIAL-A",
      calibrationLookup: async (params) => {
        lookupCalls.push(params)
        return {
          points: [
            { raw: 1000, weight: 0 },
            { raw: 2000, weight: params.deviceSerialNumber === "SERIAL-A" ? 10 : 20 },
          ],
          actualSampleRate: params.deviceSerialNumber === "SERIAL-A" ? 200 : 100,
        }
      },
    })
    const notifications = captureNotifications(device)
    device.write = async () => undefined

    await device.stream()
    device.handleNotifications(frezRawWeightPacket([{ raw: 1500, timestampUs: 1 }]))

    device.setDeviceSerialNumber("SERIAL-B")
    await device.stream()
    device.handleNotifications(frezRawWeightPacket([{ raw: 1500, timestampUs: 1 }]))

    assert.deepEqual(
      lookupCalls.map(({ deviceSerialNumber }) => deviceSerialNumber),
      ["SERIAL-A", "SERIAL-B"],
    )
    assert.deepEqual(
      notifications.map(({ current }) => current),
      [5, 10],
    )
  })

  it("keeps manual Frez Dyno calibration when the serial changes", async () => {
    let lookupCount = 0
    const device = new FrezDyno({
      calibrationPoints: [
        { raw: 1000, weight: 0 },
        { raw: 2000, weight: 10 },
      ],
      calibrationLookup: async () => {
        lookupCount++
        return null
      },
    })
    device.write = async () => undefined

    device.setDeviceSerialNumber("SERIAL-A")
    await device.stream()
    device.setDeviceSerialNumber("SERIAL-B")
    await device.stream()

    assert.equal(lookupCount, 0)
  })

  it("tares Frez Dyno in software after measurement starts", async () => {
    const device = new FrezDyno({
      calibrationPoints: [
        { raw: 1000, weight: 0 },
        { raw: 2000, weight: 10 },
      ],
    })
    const writes = []

    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }

    assert.equal(device.usesHardwareTare, false)
    const warn = console.warn
    console.warn = () => undefined
    try {
      assert.equal(device.tare(), false)
    } finally {
      console.warn = warn
    }
    assert.deepEqual(writes, [])

    await device.stream()
    assert.equal(device.tare(), true)
    assert.deepEqual(writes, [device.commands.START_WEIGHT_MEAS])
  })

  it("reads Frez Dyno firmware from the Software Revision characteristic", async () => {
    const device = new FrezDyno()
    const reads = []

    device.read = async (serviceId, characteristicId, duration) => {
      reads.push([serviceId, characteristicId, duration])
      return "1.2.3"
    }

    assert.equal(await device.firmware(), "1.2.3")
    assert.deepEqual(reads, [["device", "software", 250]])
    assert.equal("GET_FIRMWARE_VERSION" in device.commands, false)
    assert.deepEqual([...device.commands.SLEEP], [0xff])
  })

  it("stops CTS500 finite-duration streams", async () => {
    const device = new CTS500()
    let stopped = false

    device.queryFrame = async () => undefined
    device.stop = async () => {
      stopped = true
    }

    await device.stream(1)

    assert.equal(stopped, true)
  })
})
