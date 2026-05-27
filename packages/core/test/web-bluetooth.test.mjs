import assert from "node:assert/strict"
import { describe, it } from "node:test"

import {
  AuroraBoard,
  Climbro,
  CTS500,
  Entralpi,
  ForceBoard,
  Motherboard,
  mySmartBoard,
  PB700BT,
  Progressor,
  SmartBoardPro,
  WHC06,
} from "../dist/index.js"
import { captureNotifications, progressorWeightPacket } from "./helpers.mjs"
import {
  BluetoothDeviceMock,
  createDeviceMockFromGripDevice,
  installWebBluetoothMock,
  WebBluetoothMock,
} from "./web-bluetooth-helpers.mjs"

describe("WebBluetoothMock", () => {
  it("connects and disconnects supported GATT device models", async (t) => {
    const devices = [
      new Motherboard(),
      new Progressor(),
      new ForceBoard(),
      new Climbro(),
      new Entralpi(),
      new SmartBoardPro(),
      new CTS500(),
      new PB700BT(),
      new mySmartBoard(),
      new AuroraBoard(),
    ]

    const bluetoothDevices = devices.map((device) => createDeviceMockFromGripDevice(device))
    installWebBluetoothMock(t, new WebBluetoothMock(bluetoothDevices))

    for (const device of devices) {
      let connected = false
      let connectionError

      await device.connect(
        () => {
          connected = true
        },
        (error) => {
          connectionError = error
        },
      )

      assert.equal(connectionError, undefined, `${device.constructor.name} should connect without errors`)
      assert.equal(connected, true, `${device.constructor.name} should call the success callback`)
      assert.equal(device.isConnected(), true, `${device.constructor.name} should report connected`)

      device.disconnect()

      assert.equal(device.isConnected(), false, `${device.constructor.name} should report disconnected`)
    }
  })

  it("wires discovered characteristics into read, write, and notification paths", async (t) => {
    const device = new Progressor()
    const bluetoothDevice = createDeviceMockFromGripDevice(device)
    installWebBluetoothMock(t, new WebBluetoothMock([bluetoothDevice]))
    const notifications = captureNotifications(device)

    await device.connect(
      () => undefined,
      (error) => assert.fail(error.message),
    )

    const progressorService = bluetoothDevice.getServiceMock("7e4e1701-1ea6-40c9-9dcc-13d34ffead57")
    const rx = progressorService.getCharacteristicMock("7e4e1702-1ea6-40c9-9dcc-13d34ffead57")
    const tx = progressorService.getCharacteristicMock("7e4e1703-1ea6-40c9-9dcc-13d34ffead57")

    await device.write("progressor", "tx", "e")
    assert.deepEqual([...tx.lastWrite], [101])

    rx.emitValueChanged(progressorWeightPacket([{ weight: 12.5, timestampUs: 1000 }]))
    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].current, 12.5)
  })

  it("supports characteristic read values", async (t) => {
    const device = new ForceBoard()
    const bluetoothDevice = createDeviceMockFromGripDevice(device)
    installWebBluetoothMock(t, new WebBluetoothMock([bluetoothDevice]))

    await device.connect(
      () => undefined,
      (error) => assert.fail(error.message),
    )

    const batteryService = bluetoothDevice.getServiceMock("0000180f-0000-1000-8000-00805f9b34fb")
    const batteryLevel = batteryService.getCharacteristicMock("00002a19-0000-1000-8000-00805f9b34fb")
    batteryLevel.setValue(Uint8Array.from([87]))

    assert.equal(await device.battery(), "87")
  })

  it("reports an error when a matching service is missing a required characteristic", async (t) => {
    const device = new Progressor()
    const bluetoothDevice = new BluetoothDeviceMock({
      name: "Progressor Mock",
      advertisedServices: device.services.map((service) => service.uuid),
      services: [
        {
          ...device.services[0],
          characteristics: device.services[0].characteristics.filter((characteristic) => characteristic.id !== "rx"),
        },
      ],
    })
    installWebBluetoothMock(t, new WebBluetoothMock([bluetoothDevice]))
    let connectionError

    await device.connect(
      () => assert.fail("connect should not succeed when a required characteristic is missing"),
      (error) => {
        connectionError = error
      },
    )

    assert.ok(connectionError instanceof Error)
    assert.match(connectionError.message, /Characteristic .* not found in service/)
    assert.equal(device.isConnected(), false)
  })

  it("cleans up when notification startup fails", async (t) => {
    const device = new Progressor()
    const bluetoothDevice = createDeviceMockFromGripDevice(device)
    const progressorService = bluetoothDevice.getServiceMock("7e4e1701-1ea6-40c9-9dcc-13d34ffead57")
    const rx = progressorService.getCharacteristicMock("7e4e1702-1ea6-40c9-9dcc-13d34ffead57")
    rx.startNotifications = () => Promise.reject(new Error("Notifications denied"))
    installWebBluetoothMock(t, new WebBluetoothMock([bluetoothDevice]))
    let connectionError

    await device.connect(
      () => assert.fail("connect should not succeed when notifications cannot start"),
      (error) => {
        connectionError = error
      },
    )

    assert.ok(connectionError instanceof Error)
    assert.match(connectionError.message, /Notifications denied/)
    assert.equal(device.isConnected(), false)
  })

  it("supports advertisement-only WH-C06 devices", async (t) => {
    t.mock.method(globalThis, "setTimeout", () => 0)

    const device = new WHC06()
    const manufacturerPacket = new Uint8Array(12)
    manufacturerPacket[10] = 0x04
    manufacturerPacket[11] = 0xd2
    const bluetoothDevice = createDeviceMockFromGripDevice(device, {
      manufacturerData: new Map([[0x0100, manufacturerPacket]]),
      name: "IF_B7",
    })
    installWebBluetoothMock(t, new WebBluetoothMock([bluetoothDevice]))
    const notifications = captureNotifications(device)

    await device.connect(
      () => undefined,
      (error) => assert.fail(error.message),
    )

    assert.equal(device.isConnected(), true)
    assert.equal(bluetoothDevice.watchingAdvertisements, true)

    bluetoothDevice.emitAdvertisementReceived()

    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].current, 12.34)

    device.disconnect()

    assert.equal(device.isConnected(), false)
  })

  it("subtracts WH-C06 software tare from advertisement weights", async (t) => {
    t.mock.method(globalThis, "setTimeout", () => 0)

    const device = new WHC06()
    const manufacturerPacket = new Uint8Array(12)
    manufacturerPacket[10] = 0x04
    manufacturerPacket[11] = 0xd2
    const bluetoothDevice = createDeviceMockFromGripDevice(device, {
      manufacturerData: new Map([[0x0100, manufacturerPacket]]),
      name: "IF_B7",
    })
    installWebBluetoothMock(t, new WebBluetoothMock([bluetoothDevice]))
    const notifications = captureNotifications(device)

    await device.connect(
      () => undefined,
      (error) => assert.fail(error.message),
    )
    device.tare(0)

    bluetoothDevice.emitAdvertisementReceived()

    assert.equal(notifications.length, 1)
    assert.equal(notifications[0].current, 0)
  })

  it("removes WH-C06 advertisement listeners on disconnect", async (t) => {
    t.mock.method(globalThis, "setTimeout", () => 0)

    const device = new WHC06()
    const manufacturerPacket = new Uint8Array(12)
    manufacturerPacket[10] = 0x04
    manufacturerPacket[11] = 0xd2
    const bluetoothDevice = createDeviceMockFromGripDevice(device, {
      manufacturerData: new Map([[0x0100, manufacturerPacket]]),
      name: "IF_B7",
    })
    installWebBluetoothMock(t, new WebBluetoothMock([bluetoothDevice]))
    const notifications = captureNotifications(device)

    await device.connect(
      () => undefined,
      (error) => assert.fail(error.message),
    )
    device.disconnect()

    bluetoothDevice.emitAdvertisementReceived()
    assert.equal(notifications.length, 0)

    await device.connect(
      () => undefined,
      (error) => assert.fail(error.message),
    )

    bluetoothDevice.emitAdvertisementReceived()
    assert.equal(notifications.length, 1)
  })

  it("cleans up when WH-C06 advertisement watching is unsupported", async (t) => {
    const device = new WHC06()
    const bluetoothDevice = createDeviceMockFromGripDevice(device, {
      manufacturerData: new Map([[0x0100, new Uint8Array(12)]]),
      name: "IF_B7",
    })
    Object.defineProperty(bluetoothDevice, "watchAdvertisements", {
      configurable: true,
      value: undefined,
    })
    installWebBluetoothMock(t, new WebBluetoothMock([bluetoothDevice]))
    let connectionError

    await device.connect(
      () => assert.fail("connect should not succeed without watchAdvertisements support"),
      (error) => {
        connectionError = error
      },
    )

    assert.ok(connectionError instanceof Error)
    assert.match(connectionError.message, /watchAdvertisements isn't supported/)
    assert.equal(device.isConnected(), false)
  })
})
