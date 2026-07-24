import type {
  FrezDynoCoefficientLookup,
  FrezDynoCoefficientLookupParams,
  FrezDynoOptions,
  IFrezDyno,
} from "../../interfaces/device/frez-dyno.interface.js"
import { Device } from "../device.model.js"

const FREZ_COEFFICIENT_API = "https://api.frez.app/v1/dyno/coefficient"
const FREZ_PACKET_BYTES = 74
const FREZ_SAMPLES_PER_PACKET = 9
const FREZ_SAMPLE_BYTES = 8
const FREZ_TARE_SAMPLES = 100
const ONE_SECOND_MS = 1000

interface FrezDynoRawSample {
  elapsedMs: number
  rawAdc: number
}

type FrezDynoCoefficientSource = "api" | "manual" | "none"

function readEnvironmentAccessKey(): string | undefined {
  const processLike = (globalThis as { process?: { env?: Record<string, string | undefined> } }).process
  return processLike?.env?.["FREZ_ACCESS_KEY"]?.trim() || undefined
}

function assertValidCoefficient(coefficient: number): void {
  if (!Number.isFinite(coefficient) || coefficient === 0) {
    throw new Error("Frez Dyno coefficient must be a finite, non-zero number.")
  }
}

function getCoefficientQuery(params: FrezDynoCoefficientLookupParams): URLSearchParams {
  const serial = params.deviceSerialNumber?.trim()
  if (serial) return new URLSearchParams({ serial })

  const name = params.deviceName?.trim()
  if (name) return new URLSearchParams({ name })

  throw new Error("Frez Dyno coefficient lookup requires a serial number or allowlisted Bluetooth name.")
}

async function readCoefficientApiError(response: Response): Promise<string> {
  try {
    const body = (await response.json()) as { error?: unknown }
    if (typeof body.error === "string" && body.error) return body.error
  } catch {
    // Fall back to the HTTP status when the response is not JSON.
  }
  return `HTTP ${response.status}`
}

/**
 * Loads the device-specific linear coefficient from the official Frez API.
 * Native clients use `deviceSerialNumber`; Web Bluetooth clients use an
 * allowlisted `deviceName`.
 */
export async function lookupFrezDynoCoefficient(
  params: FrezDynoCoefficientLookupParams,
  accessKey = readEnvironmentAccessKey(),
): Promise<number> {
  if (typeof fetch !== "function") {
    throw new Error("Frez Dyno coefficient lookup requires Fetch API support.")
  }

  const normalizedAccessKey = accessKey?.trim()
  if (!normalizedAccessKey) {
    throw new Error(
      "Missing FREZ_ACCESS_KEY. Store the Frez Developer Program access key in the environment or provide a coefficient lookup.",
    )
  }

  const response = await fetch(`${FREZ_COEFFICIENT_API}?${getCoefficientQuery(params)}`, {
    headers: {
      "X-Frez-Access-Key": normalizedAccessKey,
    },
  })

  if (!response.ok) {
    const error = await readCoefficientApiError(response)
    throw new Error(`Frez Dyno coefficient request failed (${response.status}: ${error}).`)
  }

  const body = (await response.json()) as { a?: unknown }
  if (typeof body.a !== "number") {
    throw new Error("Frez Dyno coefficient response must contain a numeric field a.")
  }
  const coefficient = body.a
  assertValidCoefficient(coefficient)
  return coefficient
}

/** Represents a Frez Dyno device using protocol v1. */
export class FrezDyno extends Device implements IFrezDyno {
  protected override preferWriteWithResponse = true

  private readonly accessKey: string | undefined

  private coefficient: number | undefined

  private coefficientLookup: FrezDynoCoefficientLookup | null

  private coefficientLookupAttempted = false

  private coefficientSource: FrezDynoCoefficientSource = "none"

  private deviceSerialNumber: string | undefined

  private lastElapsedMs: number | undefined

  private measurementActive = false

  private recentSampleTimestamps: number[] = []

  private tareAdc: number | undefined

  private tareRawSamples: number[] = []

  private timelineOriginMs: number | undefined

  constructor(options: FrezDynoOptions = {}) {
    super({
      filters: [{ namePrefix: "FrezDyno-" }],
      services: [
        {
          name: "Frez Dyno Service",
          id: "frez-dyno",
          uuid: "da8a6c41-154b-4b9a-9b00-2f84dfcebfe9",
          characteristics: [
            {
              name: "Notify",
              id: "rx",
              uuid: "da8a6c42-154b-4b9a-9b00-2f84dfcebfe9",
            },
            {
              name: "Write",
              id: "tx",
              uuid: "da8a6c43-154b-4b9a-9b00-2f84dfcebfe9",
            },
          ],
        },
        {
          name: "Device Information",
          id: "device",
          uuid: "0000180a-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Serial Number String",
              id: "serial",
              uuid: "00002a25-0000-1000-8000-00805f9b34fb",
              optional: true,
            },
            {
              name: "Software Revision String",
              id: "software",
              uuid: "00002a28-0000-1000-8000-00805f9b34fb",
              optional: true,
            },
          ],
        },
        {
          name: "Battery Service",
          id: "battery",
          uuid: "0000180f-0000-1000-8000-00805f9b34fb",
          characteristics: [
            {
              name: "Battery Level",
              id: "level",
              uuid: "00002a19-0000-1000-8000-00805f9b34fb",
              optional: true,
            },
          ],
        },
      ],
      commands: {
        START_WEIGHT_MEAS: Uint8Array.of(0x01, 0x00),
        STOP_WEIGHT_MEAS: Uint8Array.of(0x02, 0x00),
        SLEEP: Uint8Array.of(0xff, 0x00),
      },
    })

    this.accessKey = options.accessKey?.trim() || undefined
    this.coefficientLookup =
      options.coefficientLookup === undefined
        ? (params) => lookupFrezDynoCoefficient(params, this.accessKey)
        : options.coefficientLookup
    this.deviceSerialNumber = options.deviceSerialNumber?.trim() || undefined
    if (options.coefficient !== undefined) this.setCoefficient(options.coefficient)
  }

  setCoefficient(coefficient: number): void {
    assertValidCoefficient(coefficient)
    this.coefficient = coefficient
    this.coefficientSource = "manual"
    this.coefficientLookupAttempted = false
  }

  clearCoefficient(): void {
    this.coefficient = undefined
    this.coefficientSource = "none"
    this.coefficientLookupAttempted = false
  }

  setDeviceSerialNumber(serialNumber: string | undefined): void {
    const normalizedSerialNumber = serialNumber?.trim() || undefined
    if (normalizedSerialNumber === this.deviceSerialNumber) return

    this.deviceSerialNumber = normalizedSerialNumber
    this.coefficientLookupAttempted = false
    if (this.coefficientSource === "api") {
      this.coefficient = undefined
      this.coefficientSource = "none"
    }
  }

  battery = async (): Promise<string | undefined> => {
    return await this.read("battery", "level", 250)
  }

  batteryVoltage = async (): Promise<string | undefined> => {
    return await this.battery()
  }

  firmware = async (): Promise<string | undefined> => {
    return await this.software()
  }

  serial = async (): Promise<string | undefined> => {
    if (this.deviceSerialNumber) return this.deviceSerialNumber

    try {
      const serial = (await this.read("device", "serial", 250))?.split(String.fromCharCode(0)).join("").trim()
      if (serial) this.deviceSerialNumber = serial
      return serial || undefined
    } catch (error: unknown) {
      if (!this.isExpectedSerialReadError(error)) {
        const message = error instanceof Error ? error.message : String(error)
        console.warn(`Frez Dyno serial read failed: ${message}`)
      }
      return undefined
    }
  }

  private isExpectedSerialReadError(error: unknown): boolean {
    if (!(error instanceof Error)) return false
    const message = error.message.toLowerCase()
    return (
      message.includes("characteristic") &&
      (message.includes('"serial"') || message.includes("00002a25-0000-1000-8000-00805f9b34fb")) &&
      (message.includes("not found") || message.includes("not supported") || message.includes("not permitted"))
    )
  }

  software = async (): Promise<string | undefined> => {
    return await this.read("device", "software", 250)
  }

  readonly usesHardwareTare = false

  override tare(_duration = 0): boolean {
    if (!this.measurementActive) {
      console.warn("Frez Dyno tare skipped: active measurement required.")
      return false
    }

    this.resetTare()
    return true
  }

  protected canReadDeviceSerial(): boolean {
    return this.isConnected()
  }

  protected getCoefficientDeviceName(): string | undefined {
    return this.bluetooth?.name?.trim() || undefined
  }

  protected override onConnected = async (onSuccess: () => void): Promise<void> => {
    await super.onConnected(() => undefined)

    const transportService = this.services.find((service) => service.id === "frez-dyno")
    const notifyCharacteristic = transportService?.characteristics.find((characteristic) => characteristic.id === "rx")
    const writeCharacteristic = transportService?.characteristics.find((characteristic) => characteristic.id === "tx")
    if (!notifyCharacteristic?.characteristic || !writeCharacteristic?.characteristic) {
      const firmware = await this.software().catch(() => undefined)
      throw new Error(`Frez Dyno measurement service is unavailable${firmware ? ` (firmware ${firmware})` : ""}.`)
    }

    onSuccess()
  }

  protected override onDisconnectCleanup(): void {
    this.measurementActive = false
    this.resetProtocolSession()
  }

  override handleNotifications = (value: DataView): void => {
    this.updateTimestamp()
    const samples = this.parsePacket(value)
    const receivedTime = Date.now()

    if (this.timelineOriginMs === undefined) {
      const finalSample = samples[samples.length - 1]
      this.timelineOriginMs = receivedTime - finalSample.elapsedMs
    }

    this.currentSamplesPerPacket = samples.length
    this.recordPacketReceived()

    for (const sample of samples) {
      this.processSample(sample)
    }
  }

  private parsePacket(value: DataView): FrezDynoRawSample[] {
    if (!value?.buffer || value.byteLength !== FREZ_PACKET_BYTES) {
      throw new Error(
        `Invalid Frez Dyno packet length: expected ${FREZ_PACKET_BYTES} bytes, received ${value?.byteLength ?? 0}.`,
      )
    }
    if (value.getUint8(0) !== 0x01) {
      throw new Error(`Invalid Frez Dyno response code: 0x${value.getUint8(0).toString(16).padStart(2, "0")}.`)
    }
    if (value.getUint8(1) !== 0x00) {
      throw new Error("Invalid Frez Dyno protocol v1 reserved byte.")
    }

    const samples: FrezDynoRawSample[] = []
    for (let index = 0; index < FREZ_SAMPLES_PER_PACKET; index++) {
      const offset = 2 + index * FREZ_SAMPLE_BYTES
      const sample = {
        rawAdc: value.getInt32(offset, true),
        elapsedMs: value.getUint32(offset + 4, true),
      }
      if (this.lastElapsedMs !== undefined && sample.elapsedMs <= this.lastElapsedMs) {
        throw new Error(
          `Frez Dyno device clock regressed or repeated (${sample.elapsedMs} ms after ${this.lastElapsedMs} ms).`,
        )
      }
      this.lastElapsedMs = sample.elapsedMs
      samples.push(sample)
    }
    return samples
  }

  private processSample(sample: FrezDynoRawSample): void {
    if (this.tareAdc === undefined) {
      this.tareRawSamples.push(sample.rawAdc)
      if (this.tareRawSamples.length === FREZ_TARE_SAMPLES) {
        this.tareAdc = this.tareRawSamples.reduce((sum, rawAdc) => sum + rawAdc, 0) / this.tareRawSamples.length
        this.tareRawSamples = []
      }
      return
    }

    if (this.coefficient === undefined) {
      throw new Error("Frez Dyno coefficient is unavailable.")
    }

    const weight = this.coefficient * (sample.rawAdc - this.tareAdc)
    const currentMassTotal = Math.max(-1000, weight)

    this.peak = Math.max(this.peak, currentMassTotal)
    this.min = Math.min(this.min, currentMassTotal)
    this.sum += currentMassTotal
    this.dataPointCount++
    this.mean = this.sum / this.dataPointCount

    const timestamp = (this.timelineOriginMs ?? Date.now() - sample.elapsedMs) + sample.elapsedMs
    this.downloadPackets.push(
      this.buildDownloadPacket(currentMassTotal, [sample.rawAdc], {
        timestamp,
        sampleIndex: sample.elapsedMs,
      }),
    )
    this.activityCheck(currentMassTotal)

    this.recentSampleTimestamps.push(sample.elapsedMs)
    this.recentSampleTimestamps = this.recentSampleTimestamps.filter(
      (elapsedMs) => sample.elapsedMs - elapsedMs <= ONE_SECOND_MS,
    )

    const measurement = this.buildForceMeasurement(currentMassTotal)
    measurement.timestamp = timestamp
    if (measurement.performance) {
      measurement.performance.sampleIndex = sample.elapsedMs
      measurement.performance.samplingRateHz = this.recentSampleTimestamps.length
    }
    this.notifyCallback(measurement)
  }

  private resetTare(): void {
    this.tareAdc = undefined
    this.tareRawSamples = []
  }

  private resetProtocolSession(): void {
    this.lastElapsedMs = undefined
    this.recentSampleTimestamps = []
    this.timelineOriginMs = undefined
    this.resetTare()
  }

  private async ensureDeviceSerialNumber(): Promise<void> {
    if (this.deviceSerialNumber || !this.canReadDeviceSerial()) return
    await this.serial()
  }

  private async ensureCoefficientLoaded(): Promise<void> {
    if (this.coefficient !== undefined) return
    if (this.coefficientLookupAttempted) {
      throw new Error("Frez Dyno coefficient lookup did not return a usable coefficient.")
    }
    if (!this.coefficientLookup) {
      throw new Error("Cannot start Frez Dyno measurement without a coefficient lookup or manual coefficient.")
    }

    await this.ensureDeviceSerialNumber()
    const params: FrezDynoCoefficientLookupParams = {}
    if (this.deviceSerialNumber) {
      params.deviceSerialNumber = this.deviceSerialNumber
    } else {
      const deviceName = this.getCoefficientDeviceName()
      if (deviceName) params.deviceName = deviceName
    }

    this.coefficientLookupAttempted = true
    const coefficient = await this.coefficientLookup(params)
    assertValidCoefficient(coefficient)
    this.coefficient = coefficient
    this.coefficientSource = "api"
  }

  stop = async (): Promise<void> => {
    try {
      await this.write("frez-dyno", "tx", this.commands.STOP_WEIGHT_MEAS, 0)
    } finally {
      this.measurementActive = false
    }
  }

  stream = async (duration = 0): Promise<void> => {
    this.measurementActive = false
    this.resetSessionData()
    this.resetPacketTracking()
    this.resetProtocolSession()
    await this.ensureCoefficientLoaded()

    await this.write("frez-dyno", "tx", this.commands.START_WEIGHT_MEAS, 0)
    this.measurementActive = true

    if (duration !== 0) {
      try {
        await new Promise<void>((resolve) => setTimeout(resolve, duration))
      } finally {
        await this.stop()
      }
    }
  }
}
