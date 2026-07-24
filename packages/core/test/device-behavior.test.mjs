import assert from "node:assert/strict"
import { setTimeout as delay } from "node:timers/promises"
import { describe, it } from "node:test"

import { CTS500, ForceBoard, FrezDyno, lookupFrezDynoCoefficient } from "../dist/index.js"
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
    const device = new FrezDyno({ coefficient: 0.01 })
    const writes = []

    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }

    await device.stream(10)

    assert.deepEqual(writes, [device.commands.START_WEIGHT_MEAS, device.commands.STOP_WEIGHT_MEAS])
    assert.deepEqual([...device.commands.START_WEIGHT_MEAS], [0x01, 0x00])
    assert.deepEqual([...device.commands.STOP_WEIGHT_MEAS], [0x02, 0x00])
  })

  it("requires a Frez Dyno coefficient before streaming", async () => {
    const device = new FrezDyno({ coefficientLookup: null })
    const writes = []

    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }

    await assert.rejects(device.stream(), /without a coefficient lookup or manual coefficient/)
    assert.deepEqual(writes, [])
  })

  it("calls the official Frez coefficient API with exactly one identifier", async () => {
    const originalFetch = globalThis.fetch
    const requests = []

    globalThis.fetch = async (url, init) => {
      requests.push({ url: String(url), init })
      return Response.json({ a: 0.000012345678 })
    }

    try {
      assert.equal(await lookupFrezDynoCoefficient({ deviceName: "FrezDyno-002318" }, "secret-key"), 0.000012345678)
      assert.equal(
        await lookupFrezDynoCoefficient(
          { deviceName: "FrezDyno-002318", deviceSerialNumber: "FrezDyno-000123" },
          "secret-key",
        ),
        0.000012345678,
      )
      assert.equal(requests[0].url, "https://api.frez.app/v1/dyno/coefficient?name=FrezDyno-002318")
      assert.equal(requests[1].url, "https://api.frez.app/v1/dyno/coefficient?serial=FrezDyno-000123")
      assert.equal(requests[0].init.headers["X-Frez-Access-Key"], "secret-key")
      assert.equal(requests[0].init.method, undefined)
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("reports coefficient API and response errors clearly", async () => {
    const originalFetch = globalThis.fetch

    try {
      await assert.rejects(lookupFrezDynoCoefficient({ deviceName: "FrezDyno-002318" }), /Missing FREZ_ACCESS_KEY/)
      globalThis.fetch = async () => Response.json({ error: "developer_device_not_allowlisted" }, { status: 403 })
      await assert.rejects(
        lookupFrezDynoCoefficient({ deviceName: "FrezDyno-002318" }, "secret-key"),
        /403: developer_device_not_allowlisted/,
      )
      globalThis.fetch = async () => Response.json({ a: "not-a-number" })
      await assert.rejects(
        lookupFrezDynoCoefficient({ deviceName: "FrezDyno-002318" }, "secret-key"),
        /numeric field a/,
      )
    } finally {
      globalThis.fetch = originalFetch
    }
  })

  it("uses the allowlisted Bluetooth name for Web Bluetooth coefficient lookup", async () => {
    const lookupCalls = []
    const device = new FrezDyno({
      coefficientLookup: async (params) => {
        lookupCalls.push(params)
        return 0.01
      },
    })
    const writes = []

    device.bluetooth = { id: "opaque-device-id", name: "FrezDyno-002318", gatt: { connected: true } }
    device.read = async () => {
      throw new Error('Characteristic "serial" not found in service "device"')
    }
    device.write = async (_serviceId, _characteristicId, message) => {
      writes.push(message)
    }

    await device.stream()

    assert.deepEqual(lookupCalls, [{ deviceName: "FrezDyno-002318" }])
    assert.deepEqual(writes, [device.commands.START_WEIGHT_MEAS])
  })

  it("uses the native serial for coefficient lookup before streaming", async () => {
    const lookupCalls = []
    const reads = []

    class NativeFrezDyno extends FrezDyno {
      canReadDeviceSerial() {
        return true
      }
    }

    const device = new NativeFrezDyno({
      coefficientLookup: async (params) => {
        lookupCalls.push(params)
        return 0.01
      },
    })

    device.read = async (serviceId, characteristicId, duration) => {
      reads.push([serviceId, characteristicId, duration])
      return "FrezDyno-000123\0"
    }
    device.write = async () => undefined

    await device.stream()

    assert.deepEqual(reads, [["device", "serial", 250]])
    assert.deepEqual(lookupCalls, [{ deviceSerialNumber: "FrezDyno-000123" }])
  })

  it("reloads an API coefficient when the Frez Dyno serial changes", async () => {
    const lookupCalls = []
    const device = new FrezDyno({
      deviceSerialNumber: "SERIAL-A",
      coefficientLookup: async (params) => {
        lookupCalls.push(params)
        return params.deviceSerialNumber === "SERIAL-A" ? 0.01 : 0.02
      },
    })
    device.write = async () => undefined

    await device.stream()
    device.setDeviceSerialNumber("SERIAL-B")
    await device.stream()

    assert.deepEqual(
      lookupCalls.map(({ deviceSerialNumber }) => deviceSerialNumber),
      ["SERIAL-A", "SERIAL-B"],
    )
  })

  it("keeps a manual Frez Dyno coefficient when the serial changes", async () => {
    let lookupCount = 0
    const device = new FrezDyno({
      coefficient: 0.01,
      coefficientLookup: async () => {
        lookupCount++
        return 0.02
      },
    })
    device.write = async () => undefined

    device.setDeviceSerialNumber("SERIAL-A")
    await device.stream()
    device.setDeviceSerialNumber("SERIAL-B")
    await device.stream()

    assert.equal(lookupCount, 0)
  })

  it("tares Frez Dyno from the first 100 unloaded samples", async () => {
    const device = new FrezDyno({ coefficient: 0.01 })
    const notifications = captureNotifications(device)
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
    let elapsedMs = 0
    for (let packet = 0; packet < 11; packet++) {
      device.handleNotifications(
        frezRawWeightPacket(
          Array.from({ length: 9 }, () => {
            const sample = { raw: 1000, elapsedMs }
            elapsedMs += 4
            return sample
          }),
        ),
      )
    }
    assert.equal(notifications.length, 0)

    device.handleNotifications(
      frezRawWeightPacket(
        Array.from({ length: 9 }, (_, index) => {
          const sample = { raw: index === 0 ? 1000 : 1500, elapsedMs }
          elapsedMs += 4
          return sample
        }),
      ),
    )
    assert.equal(notifications.length, 8)
    assert.equal(notifications[0].current, 5)
    assert.equal(notifications[7].performance.sampleIndex, 428)
    assert.equal(notifications[7].performance.samplesPerPacket, 9)

    assert.equal(device.tare(5000), true)
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
    assert.deepEqual([...device.commands.SLEEP], [0xff, 0x00])
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
