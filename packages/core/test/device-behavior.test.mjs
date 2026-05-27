import assert from "node:assert/strict"
import { setTimeout as delay } from "node:timers/promises"
import { describe, it } from "node:test"

import { CTS500, ForceBoard } from "../dist/index.js"

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
