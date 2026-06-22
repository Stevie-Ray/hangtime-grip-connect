import assert from "node:assert/strict"
import { setTimeout as delay } from "node:timers/promises"
import { describe, it } from "node:test"

import { CTS500, ForceBoard, FrezDyno } from "../dist/index.js"
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

  it("tares Frez Dyno with the hardware command after measurement starts", async () => {
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

    assert.equal(device.usesHardwareTare, true)
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
    assert.deepEqual(writes, [device.commands.START_WEIGHT_MEAS, device.commands.TARE_SCALE])
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
    assert.equal("SLEEP" in device.commands, false)
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
