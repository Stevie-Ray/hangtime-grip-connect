function leftPad(value, count, pad) {
  while (value.length < count) {
    value = pad + value
  }
  return value
}

export function normalizeUuid(uuid) {
  if (typeof uuid === "number" && uuid > 0) {
    return `${leftPad(uuid.toString(16), 8, "0")}-0000-1000-8000-00805f9b34fb`
  }

  return uuid.toString().toLowerCase()
}

export function installWebBluetoothMock(t, bluetooth) {
  const originalNavigatorDescriptor = Object.getOwnPropertyDescriptor(globalThis, "navigator")
  const originalNavigator = globalThis.navigator
  const originalBluetoothDescriptor = originalNavigator
    ? Object.getOwnPropertyDescriptor(originalNavigator, "bluetooth")
    : undefined

  if (originalNavigator && Object.prototype.propertyIsEnumerable.call(globalThis, "navigator")) {
    originalNavigator.bluetooth = bluetooth
  } else {
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { bluetooth },
    })
  }

  t.after(() => {
    if (originalNavigator) {
      if (originalBluetoothDescriptor) {
        Object.defineProperty(originalNavigator, "bluetooth", originalBluetoothDescriptor)
      } else {
        delete originalNavigator.bluetooth
      }
    }

    if (originalNavigatorDescriptor) {
      Object.defineProperty(globalThis, "navigator", originalNavigatorDescriptor)
    } else {
      delete globalThis.navigator
    }
  })
}

export function createDeviceMockFromGripDevice(device, options = {}) {
  const services = device.services.length > 0 ? device.services : [createFallbackService()]
  const advertisedServices = [
    ...new Set([
      ...device.filters.flatMap((filter) => filter.services?.map(normalizeUuid) ?? []),
      ...services.map((service) => normalizeUuid(service.uuid)),
    ]),
  ]

  return new BluetoothDeviceMock({
    name: options.name ?? getMockName(device),
    services,
    advertisedServices: options.advertisedServices ?? advertisedServices,
    manufacturerData: options.manufacturerData,
  })
}

export class CharacteristicMock extends EventTarget {
  value
  lastWrite
  properties = {
    authenticatedSignedWrites: false,
    broadcast: false,
    indicate: false,
    notify: true,
    read: true,
    reliableWrite: false,
    writableAuxiliaries: false,
    write: true,
    writeWithoutResponse: true,
  }
  oncharacteristicvaluechanged = null

  constructor(service, uuid) {
    super()
    this.service = service
    this.uuid = normalizeUuid(uuid)
    this.value = new DataView(new Uint8Array(1).buffer)
  }

  startNotifications() {
    return Promise.resolve(this)
  }

  stopNotifications() {
    return Promise.resolve(this)
  }

  readValue() {
    return Promise.resolve(this.value)
  }

  writeValue(value) {
    this.lastWrite = toUint8Array(value)
    return Promise.resolve()
  }

  writeValueWithoutResponse(value) {
    this.lastWrite = toUint8Array(value)
    return Promise.resolve()
  }

  writeValueWithResponse(value) {
    this.lastWrite = toUint8Array(value)
    return Promise.resolve()
  }

  getDescriptor() {
    return Promise.reject(new Error("Not implemented"))
  }

  getDescriptors() {
    return Promise.reject(new Error("Not implemented"))
  }

  setValue(value) {
    this.value = value instanceof DataView ? value : toDataView(toUint8Array(value))
  }

  emitValueChanged(value) {
    if (value !== undefined) {
      this.setValue(value)
    }

    const event = new Event("characteristicvaluechanged")
    this.dispatchEvent(event)
    this.oncharacteristicvaluechanged?.(event)
  }
}

export class PrimaryServiceMock extends EventTarget {
  oncharacteristicvaluechanged = null
  onserviceadded = null
  onservicechanged = null
  onserviceremoved = null
  #characteristicMocks = new Map()

  constructor(device, service) {
    super()
    this.device = device
    this.uuid = normalizeUuid(service.uuid)
    this.isPrimary = service.isPrimary ?? true

    for (const characteristic of service.characteristics ?? []) {
      this.#characteristicMocks.set(
        normalizeUuid(characteristic.uuid),
        new CharacteristicMock(this, characteristic.uuid),
      )
    }
  }

  getCharacteristic(characteristic) {
    const characteristicMock = this.getCharacteristicMock(characteristic)

    if (!characteristicMock) {
      return Promise.reject(new Error(`Characteristic ${String(characteristic)} not found`))
    }

    return Promise.resolve(characteristicMock)
  }

  getCharacteristics() {
    return Promise.resolve([...this.#characteristicMocks.values()])
  }

  getIncludedService() {
    return Promise.reject(new Error("Not implemented"))
  }

  getIncludedServices() {
    return Promise.resolve([])
  }

  getCharacteristicMock(characteristic) {
    return this.#characteristicMocks.get(normalizeUuid(characteristic))
  }
}

export class GattMock extends EventTarget {
  connected = false
  #serviceMocks = new Map()

  constructor(device, services) {
    super()
    this.device = device

    for (const service of services) {
      this.#serviceMocks.set(normalizeUuid(service.uuid), new PrimaryServiceMock(device, service))
    }
  }

  connect() {
    this.connected = true
    return Promise.resolve(this)
  }

  disconnect() {
    this.connected = false
    const event = new Event("gattserverdisconnected")
    this.device.dispatchEvent(event)
    this.device.ongattserverdisconnected?.(event)
  }

  getPrimaryService(service) {
    const serviceMock = this.getServiceMock(service)

    if (!serviceMock) {
      return Promise.reject(new Error(`Service ${String(service)} not found`))
    }

    return Promise.resolve(serviceMock)
  }

  getPrimaryServices(service) {
    if (service) {
      const serviceMock = this.getServiceMock(service)
      return Promise.resolve(serviceMock ? [serviceMock] : [])
    }

    return Promise.resolve([...this.#serviceMocks.values()])
  }

  getServiceMock(service) {
    return this.#serviceMocks.get(normalizeUuid(service))
  }

  getServiceMocks() {
    return [...this.#serviceMocks.values()]
  }
}

export class BluetoothDeviceMock extends EventTarget {
  watchingAdvertisements = false
  id
  ongattserverdisconnected = null
  oncharacteristicvaluechanged = null
  onserviceadded = null
  onservicechanged = null
  onserviceremoved = null

  constructor({ name, services, advertisedServices, manufacturerData, id = "" }) {
    super()
    this.name = name
    this.id = id
    this.advertisedServices = new Set(advertisedServices.map(normalizeUuid))
    this.manufacturerData = new Map(
      [...(manufacturerData ?? new Map()).entries()].map(([key, value]) => [
        key,
        value instanceof DataView ? value : toDataView(toUint8Array(value)),
      ]),
    )
    this.gatt = new GattMock(this, services)
  }

  hasService(service) {
    return this.advertisedServices.has(normalizeUuid(service))
  }

  hasManufacturerData(companyIdentifier) {
    return this.manufacturerData.has(companyIdentifier)
  }

  watchAdvertisements() {
    this.watchingAdvertisements = true
    return Promise.resolve()
  }

  unwatchAdvertisements() {
    this.watchingAdvertisements = false
  }

  emitAdvertisementReceived(manufacturerData = this.manufacturerData) {
    const event = new Event("advertisementreceived")
    Object.defineProperty(event, "manufacturerData", {
      configurable: true,
      value: manufacturerData,
    })
    this.dispatchEvent(event)
  }

  getServiceMock(service) {
    return this.gatt.getServiceMock(service)
  }

  getServiceMocks() {
    return this.gatt.getServiceMocks()
  }
}

export class WebBluetoothMock {
  constructor(devices) {
    this.devices = devices
  }

  getAvailability() {
    return Promise.resolve(true)
  }

  getDevices() {
    return Promise.resolve(this.devices)
  }

  requestDevice(options = {}) {
    const device = this.devices.find((candidate) => matchesRequestDeviceOptions(candidate, options))

    if (!device) {
      return Promise.reject(new Error("User cancelled device chooser"))
    }

    return Promise.resolve(device)
  }
}

function matchesRequestDeviceOptions(device, options) {
  if (options.acceptAllDevices) {
    return true
  }

  return (options.filters ?? []).some((filter) => matchesFilter(device, filter))
}

function matchesFilter(device, filter) {
  if (filter.name && filter.name !== device.name) {
    return false
  }

  if (filter.namePrefix && !device.name?.startsWith(filter.namePrefix)) {
    return false
  }

  if (filter.services?.some((service) => !device.hasService(service))) {
    return false
  }

  if (filter.manufacturerData?.some((data) => !device.hasManufacturerData(data.companyIdentifier))) {
    return false
  }

  return true
}

function getMockName(device) {
  const namedFilter = device.filters.find((filter) => filter.name || filter.namePrefix)

  if (namedFilter?.name) {
    return namedFilter.name
  }

  if (namedFilter?.namePrefix) {
    return `${namedFilter.namePrefix} Mock`
  }

  return `${device.constructor.name} Mock`
}

function createFallbackService() {
  return {
    name: "Mock Service",
    id: "mock",
    uuid: "00001800-0000-1000-8000-00805f9b34fb",
    characteristics: [],
  }
}

function toUint8Array(value) {
  if (value instanceof Uint8Array) {
    return value
  }

  if (value instanceof DataView) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  }

  if (ArrayBuffer.isView(value)) {
    return new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
  }

  if (value instanceof ArrayBuffer) {
    return new Uint8Array(value)
  }

  return Uint8Array.from(value)
}

function toDataView(value) {
  return new DataView(value.buffer, value.byteOffset, value.byteLength)
}
