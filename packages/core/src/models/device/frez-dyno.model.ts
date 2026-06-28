import { Device } from "../device.model.js"
import type {
  FrezDynoCalibrationLookup,
  FrezDynoCalibrationLookupParams,
  FrezDynoCalibrationPoint,
  FrezDynoOptions,
  FrezDynoPacketFormat,
  IFrezDyno,
} from "../../interfaces/device/frez-dyno.interface.js"

const ONE_SECOND_US = 1_000_000
const FREZ_CALIBRATION_RPC = "https://cntqmiyjjjdgvigkzexf.supabase.co/rest/v1/rpc/get_calibration_secure"
const FREZ_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNudHFtaXlqampkZ3ZpZ2t6ZXhmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE3NDcxNDAsImV4cCI6MjA0NzMyMzE0MH0.2kZau5xe2WMcYyVvUbd9qHMpYKvafQYK1Y7iJh40Amg"

interface FrezDynoWeightSample {
  raw: number
  timestampUs: number
  weight: number
}

/**
 * Frez Dyno responses.
 */
enum FrezDynoResponses {
  /**
   * Response received after sending a command to the device.
   */
  RESPONSE_COMMAND,

  /**
   * Data representing a weight measurement from the device.
   */
  RESPONSE_WEIGHT_MEASUREMENT,

  /**
   * Peak rate of force development (RFD) measurement.
   */
  RESPONSE_RFD_PEAK,

  /**
   * Series of peak rate of force development (RFD) measurements.
   */
  RESPONSE_RFD_PEAK_SERIES,

  /**
   * Low battery warning from the device.
   */
  RESPONSE_LOW_POWER_WARNING,
}

/**
 * Format bytes as hex string.
 * @param payload - Bytes to format
 * @param separator - String between bytes (default " ")
 */
function toHex(payload: Uint8Array, separator = " "): string {
  return Array.from(payload)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join(separator)
}

function parseJsonMaybe(value: unknown): unknown {
  if (typeof value !== "string") return value

  try {
    return JSON.parse(value) as unknown
  } catch {
    return value
  }
}

function objectRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

function readNumber(record: Record<string, unknown>, keys: string[]): number | undefined {
  for (const key of keys) {
    const value = record[key]
    if (value == null) continue
    const numericValue = Number(value)
    if (Number.isFinite(numericValue)) return numericValue
  }

  return undefined
}

function parseRemoteCalibrationPoint(value: unknown): FrezDynoCalibrationPoint | null {
  const record = objectRecord(value)
  if (!record) return null

  const raw = readNumber(record, ["raw", "rawValue", "raw_value", "adcValue", "adc_value", "adc", "value"])
  const weight = readNumber(record, ["weight", "targetWeight", "target_weight", "kg", "load"])
  if (raw === undefined || weight === undefined) return null

  return { raw, weight }
}

function parseRemoteCalibrationPoints(payload: unknown): FrezDynoCalibrationPoint[] | null {
  const normalizedPayload = parseJsonMaybe(payload)

  if (Array.isArray(normalizedPayload)) {
    const points = normalizedPayload.map(parseRemoteCalibrationPoint)
    if (points.length >= 2 && points.every((point) => point !== null)) {
      return points
    }

    for (const item of normalizedPayload) {
      const nestedPoints = parseRemoteCalibrationPoints(item)
      if (nestedPoints) return nestedPoints
    }

    return null
  }

  const record = objectRecord(normalizedPayload)
  if (!record) return null

  for (const key of ["calibration_points", "calibrationPoints", "points", "data"]) {
    const points = parseRemoteCalibrationPoints(record[key])
    if (points) return points
  }

  return null
}

export async function lookupFrezDynoRemoteCalibration(
  params: FrezDynoCalibrationLookupParams,
): Promise<FrezDynoCalibrationPoint[] | null> {
  if (typeof fetch !== "function") return null
  if (!params.deviceName && !params.deviceSerialNumber) return null

  const response = await fetch(FREZ_CALIBRATION_RPC, {
    method: "POST",
    headers: {
      apikey: FREZ_SUPABASE_ANON_KEY,
      authorization: `Bearer ${FREZ_SUPABASE_ANON_KEY}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({
      p_device_name: params.deviceName ?? null,
      p_device_serial_number: params.deviceSerialNumber ?? null,
    }),
  })

  if (!response.ok) return null

  const payload: unknown = await response.json()
  return parseRemoteCalibrationPoints(payload)
}

/**
 * Represents a Frez Dyno device.
 */
export class FrezDyno extends Device implements IFrezDyno {
  private calibrationLookup: FrezDynoCalibrationLookup | null = lookupFrezDynoRemoteCalibration

  private calibrationLookupAttempted = false

  private calibrationPoints: FrezDynoCalibrationPoint[] = []

  private deviceSerialNumber: string | undefined

  private packetFormat: FrezDynoPacketFormat = "raw"

  private requireCalibration = true

  /** Device timestamps in microseconds of recent samples (samples in last 1s device time). */
  private recentSampleTimestamps: number[] = []

  private measurementActive = false

  constructor(options: FrezDynoOptions = {}) {
    super({
      filters: [{ namePrefix: "FrezDyno" }],
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
            },
          ],
        },
      ],
      commands: {
        TARE_SCALE: "d", // 100 (0x64)
        START_WEIGHT_MEAS: "e", // 101 (0x65)
        STOP_WEIGHT_MEAS: "f", // 102 (0x66)
        START_PEAK_RFD_MEAS: "g", // 103 (0x67)
        START_PEAK_RFD_MEAS_SERIES: "h", // 104 (0x68)
        GET_BATTERY_VOLTAGE: "o", // 111 (0x6f)
      },
    })

    this.packetFormat = options.packetFormat ?? "raw"
    this.requireCalibration = options.requireCalibration ?? this.packetFormat !== "float"
    this.deviceSerialNumber = options.deviceSerialNumber
    this.calibrationLookup =
      options.calibrationLookup === undefined ? lookupFrezDynoRemoteCalibration : options.calibrationLookup
    if (options.calibrationPoints) this.setRawCalibration(options.calibrationPoints)
  }

  setRawCalibration(points: FrezDynoCalibrationPoint[]): void {
    if (points.length < 2) {
      throw new Error("Frez Dyno calibration requires at least two points.")
    }

    const normalized = points.map(({ raw, weight }) => {
      if (!Number.isFinite(raw) || !Number.isFinite(weight)) {
        throw new Error("Frez Dyno calibration points must use finite raw and weight values.")
      }

      return { raw, weight }
    })

    const rawValues = new Set(normalized.map(({ raw }) => raw))
    if (rawValues.size !== normalized.length) {
      throw new Error("Frez Dyno calibration points must use unique raw values.")
    }

    this.calibrationPoints = normalized.sort((a, b) => a.raw - b.raw)
  }

  clearRawCalibration(): void {
    this.calibrationPoints = []
    this.calibrationLookupAttempted = false
  }

  /**
   * Retrieves battery level from the standard Battery service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery percentage.
   */
  battery = async (): Promise<string | undefined> => {
    return await this.read("battery", "level", 250)
  }

  /**
   * Retrieves battery voltage through the Frez Dyno command characteristic.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery voltage response.
   */
  batteryVoltage = async (): Promise<string | undefined> => {
    let response: string | undefined = undefined
    await this.write("frez-dyno", "tx", this.commands.GET_BATTERY_VOLTAGE, 250, (data) => {
      response = data
    })
    return response
  }

  /**
   * Retrieves firmware version from the standard Software Revision characteristic.
   * @returns {Promise<string | undefined>} A Promise that resolves with the firmware version.
   */
  firmware = async (): Promise<string | undefined> => {
    return await this.software()
  }

  /**
   * Retrieves serial number from the standard Device Information service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the serial number.
   */
  serial = async (): Promise<string | undefined> => {
    if (this.deviceSerialNumber) return this.deviceSerialNumber

    try {
      const serial = (await this.read("device", "serial", 250))?.trim()
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

  /**
   * Retrieves software version from the standard Device Information service.
   * @returns {Promise<string | undefined>} A Promise that resolves with the software version.
   */
  software = async (): Promise<string | undefined> => {
    return await this.read("device", "software", 250)
  }

  /** True if tare() uses device hardware tare rather than software averaging. */
  readonly usesHardwareTare = true

  override tare(duration = 5000): boolean {
    void duration // Accepted for API compatibility; hardware tare ignores it
    if (!this.measurementActive) {
      console.warn("Frez Dyno tare skipped: active measurement required.")
      return false
    }
    this.clearTareOffset()
    void this.write("frez-dyno", "tx", this.commands.TARE_SCALE, 0).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Frez Dyno tare failed: ${message}`)
    })
    return true
  }

  /**
   * Handles data received from the device and processes weight measurements.
   *
   * @param {DataView} value - The notification event.
   */
  override handleNotifications = (value: DataView): void => {
    if (!value?.buffer || value.byteLength === 0) return

    this.updateTimestamp()

    const receivedTime = Date.now()
    const bytes = new Uint8Array(value.buffer, value.byteOffset, value.byteLength)
    const framedKind = this.getFramedResponseKind(value)

    if (framedKind !== undefined) {
      this.handleFramedNotification(value, bytes, framedKind, receivedTime)
      return
    }

    const samples = this.parseUnframedWeightSamples(value, receivedTime)
    if (samples) {
      this.emitWeightSamples(samples, receivedTime)
      return
    }

    this.warnUnsupportedNotification(bytes, "unrecognized packet format")
  }

  private getFramedResponseKind(value: DataView): FrezDynoResponses | undefined {
    if (value.byteLength < 2) return undefined

    const kind = value.getUint8(0)
    const payloadLength = value.getUint8(1)
    if (payloadLength !== value.byteLength - 2) return undefined

    if (kind === FrezDynoResponses.RESPONSE_COMMAND && this.writeLast) return kind
    if (kind === FrezDynoResponses.RESPONSE_WEIGHT_MEASUREMENT && payloadLength > 0 && payloadLength % 8 === 0) {
      return kind
    }
    if (
      kind === FrezDynoResponses.RESPONSE_RFD_PEAK ||
      kind === FrezDynoResponses.RESPONSE_RFD_PEAK_SERIES ||
      kind === FrezDynoResponses.RESPONSE_LOW_POWER_WARNING
    ) {
      return kind
    }

    return undefined
  }

  private handleFramedNotification(
    value: DataView,
    bytes: Uint8Array,
    kind: FrezDynoResponses,
    receivedTime: number,
  ): void {
    const payloadLength = value.getUint8(1)
    const payload = bytes.slice(2, 2 + payloadLength)

    if (kind === FrezDynoResponses.RESPONSE_WEIGHT_MEASUREMENT) {
      const samplesPerPacket = payloadLength / 8
      const samples: FrezDynoWeightSample[] = []

      for (let i = 0; i < samplesPerPacket; i++) {
        const offset = 2 + i * 8
        samples.push(this.parseWeightSample(value, offset))
      }
      this.emitWeightSamples(samples, receivedTime)
    } else if (kind === FrezDynoResponses.RESPONSE_COMMAND) {
      if (!this.writeLast) return

      let output: string
      if (this.writeLast === this.commands.GET_BATTERY_VOLTAGE && payload.length >= 4) {
        output = new DataView(payload.buffer, payload.byteOffset, payload.byteLength).getUint32(0, true).toString()
      } else {
        output = toHex(payload)
      }
      this.writeCallback(output)
    } else if (kind === FrezDynoResponses.RESPONSE_RFD_PEAK) {
      console.warn("Frez Dyno RFD peak is currently unsupported.")
    } else if (kind === FrezDynoResponses.RESPONSE_RFD_PEAK_SERIES) {
      console.warn("Frez Dyno RFD peak series is currently unsupported.")
    } else if (kind === FrezDynoResponses.RESPONSE_LOW_POWER_WARNING) {
      console.warn("Frez Dyno low power warning received.")
    } else {
      this.warnUnsupportedNotification(bytes, `unknown message kind ${kind}`)
    }
  }

  private emitWeightSamples(samples: FrezDynoWeightSample[], receivedTime: number): void {
    const validSamples = samples.filter((sample) => !Number.isNaN(sample.weight))
    if (validSamples.length === 0) return

    this.currentSamplesPerPacket = validSamples.length
    this.recordPacketReceived()

    for (const { raw, timestampUs, weight } of validSamples) {
      const numericData = weight - this.applyTare(weight)
      const currentMassTotal = Math.max(-1000, Number(numericData))

      this.peak = Math.max(this.peak, currentMassTotal)
      this.min = Math.min(this.min, currentMassTotal)
      this.sum += currentMassTotal
      this.dataPointCount++
      this.mean = this.sum / this.dataPointCount

      this.downloadPackets.push(
        this.buildDownloadPacket(currentMassTotal, [raw], {
          timestamp: receivedTime,
          sampleIndex: timestampUs,
        }),
      )
      this.activityCheck(currentMassTotal)

      this.recentSampleTimestamps.push(timestampUs)
      const latestUs = this.recentSampleTimestamps[this.recentSampleTimestamps.length - 1] ?? 0
      this.recentSampleTimestamps = this.recentSampleTimestamps.filter((ts) => latestUs - ts <= ONE_SECOND_US)
      const samplingRateHz = this.recentSampleTimestamps.length

      const measurement = this.buildForceMeasurement(currentMassTotal)
      if (measurement.performance) measurement.performance.samplingRateHz = samplingRateHz
      this.notifyCallback(measurement)
    }
  }

  private parseUnframedWeightSamples(value: DataView, receivedTime: number): FrezDynoWeightSample[] | null {
    if (this.isClearlyTimestampedRawPacket(value)) {
      const samples: FrezDynoWeightSample[] = []
      for (let offset = 0; offset < value.byteLength; offset += 8) {
        samples.push(this.parseRawWeightSample(value.getUint32(offset, true), value.getUint32(offset + 4, true)))
      }
      return samples
    }

    const sampleByteLength = value.byteLength % 4 === 0 ? 4 : value.byteLength % 2 === 0 ? 2 : 0
    if (sampleByteLength === 0) return null

    const samples: FrezDynoWeightSample[] = []
    for (let offset = 0; offset < value.byteLength; offset += sampleByteLength) {
      const sampleIndex = offset / sampleByteLength
      const raw = sampleByteLength === 4 ? value.getUint32(offset, true) : value.getUint16(offset, true)
      samples.push(this.parseRawWeightSample(raw, this.syntheticTimestampUs(receivedTime, sampleIndex)))
    }

    return samples
  }

  private isClearlyTimestampedRawPacket(value: DataView): boolean {
    if (value.byteLength < 8 || value.byteLength % 8 !== 0) return false

    let previousTimestamp: number | undefined = undefined
    for (let offset = 0; offset < value.byteLength; offset += 8) {
      const raw = value.getUint32(offset, true)
      const timestampUs = value.getUint32(offset + 4, true)
      if (!this.isLikelyRawAdcValue(raw) || this.isLikelyRawAdcValue(timestampUs)) return false
      if (previousTimestamp !== undefined && timestampUs <= previousTimestamp) return false
      previousTimestamp = timestampUs
    }

    return true
  }

  private isLikelyRawAdcValue(raw: number): boolean {
    if (!Number.isFinite(raw) || raw < 0) return false
    if (this.calibrationPoints.length < 2) return raw <= 0x00ffffff

    const minRaw = this.calibrationPoints[0].raw
    const maxRaw = this.calibrationPoints[this.calibrationPoints.length - 1].raw
    const span = Math.max(1, maxRaw - minRaw)
    return raw >= Math.max(0, minRaw - span * 2) && raw <= maxRaw + span * 2
  }

  private syntheticTimestampUs(receivedTime: number, sampleIndex: number): number {
    return receivedTime * 1000 + sampleIndex
  }

  private parseWeightSample(value: DataView, offset: number): FrezDynoWeightSample {
    const timestampUs = value.getUint32(offset + 4, true)

    if (this.packetFormat !== "raw") {
      const weight = value.getFloat32(offset, true)
      const rawBits = value.getUint32(offset, true)
      if (this.packetFormat === "float" || this.isPlausibleFloatWeight(weight, rawBits)) {
        return {
          raw: weight,
          timestampUs,
          weight,
        }
      }
    }

    const rawSigned = value.getInt32(offset, true)
    const rawUnsigned = value.getUint32(offset, true)
    const raw = rawSigned >= 0 ? rawSigned : rawUnsigned
    return this.parseRawWeightSample(raw, timestampUs)
  }

  private parseRawWeightSample(raw: number, timestampUs: number): FrezDynoWeightSample {
    const weight = this.predictWeight(raw)

    if (weight === undefined) {
      const lookupStatus = this.calibrationLookupAttempted
        ? " Automatic calibration lookup did not return usable points."
        : ""
      throw new Error(
        `Frez Dyno sent raw sensor data (${raw}), but no calibration is configured.${lookupStatus} Call setRawCalibration() with at least two device-specific raw/weight points.`,
      )
    }

    return {
      raw,
      timestampUs,
      weight,
    }
  }

  private isPlausibleFloatWeight(weight: number, rawBits: number): boolean {
    if (!Number.isFinite(weight)) return false
    if (Math.abs(weight) > 1000) return false

    // Integer raw counts decode as denormal floats close to zero, which caused
    // Frez readings to display as 0 when parsed like Progressor packets.
    return rawBits === 0 || Math.abs(weight) >= 1e-30
  }

  private predictWeight(raw: number): number | undefined {
    if (this.calibrationPoints.length < 2) return undefined

    let lower = this.calibrationPoints[0]
    let upper = this.calibrationPoints[1]

    if (raw <= lower.raw) {
      upper = this.calibrationPoints[1]
    } else if (raw >= this.calibrationPoints[this.calibrationPoints.length - 1].raw) {
      lower = this.calibrationPoints[this.calibrationPoints.length - 2]
      upper = this.calibrationPoints[this.calibrationPoints.length - 1]
    } else {
      for (let i = 0; i < this.calibrationPoints.length - 1; i++) {
        const current = this.calibrationPoints[i]
        const next = this.calibrationPoints[i + 1]
        if (raw >= current.raw && raw <= next.raw) {
          lower = current
          upper = next
          break
        }
      }
    }

    const rawDelta = upper.raw - lower.raw
    if (rawDelta === 0) return undefined

    const ratio = (raw - lower.raw) / rawDelta
    return lower.weight + ratio * (upper.weight - lower.weight)
  }

  private async ensureDeviceSerialNumber(): Promise<void> {
    if (this.deviceSerialNumber || !this.isConnected()) return

    try {
      await this.serial()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Frez Dyno serial read failed: ${message}`)
    }
  }

  private async ensureCalibrationLoaded(): Promise<void> {
    if (this.calibrationPoints.length >= 2 || this.calibrationLookupAttempted || !this.calibrationLookup) return

    await this.ensureDeviceSerialNumber()

    const params: FrezDynoCalibrationLookupParams = {}
    const deviceId = this.bluetooth?.id?.trim()
    const deviceName = this.bluetooth?.name?.trim()
    if (deviceId) params.deviceId = deviceId
    if (deviceName) params.deviceName = deviceName
    if (this.deviceSerialNumber) params.deviceSerialNumber = this.deviceSerialNumber
    if (!params.deviceId && !params.deviceName && !params.deviceSerialNumber) return

    this.calibrationLookupAttempted = true
    try {
      const points = await this.calibrationLookup(params)
      if (points) this.setRawCalibration(points)
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error)
      console.warn(`Frez Dyno calibration lookup failed: ${message}`)
    }
  }

  private warnUnsupportedNotification(bytes: Uint8Array, reason: string): void {
    const previewLength = 16
    const preview = toHex(bytes.slice(0, previewLength))
    const suffix = bytes.length > previewLength ? " ..." : ""
    console.warn(`Frez Dyno ignored notification (${reason}): ${preview}${suffix}`)
  }

  private assertCanStartMeasurement(): void {
    if (!this.requireCalibration || this.calibrationPoints.length >= 2) return

    const lookupStatus = !this.calibrationLookup
      ? " Automatic calibration lookup is disabled."
      : this.calibrationLookupAttempted
        ? " Automatic calibration lookup did not return usable points."
        : " No device name or serial number was available for automatic calibration lookup."
    throw new Error(
      `Cannot start Frez Dyno measurement without calibration data.${lookupStatus} Configure calibrationPoints or call setRawCalibration() with at least two device-specific raw/weight points.`,
    )
  }

  /**
   * Stops the data stream on the Frez Dyno.
   * @returns {Promise<void>} A promise that resolves when the stream is stopped.
   */
  stop = async (): Promise<void> => {
    try {
      await this.write("frez-dyno", "tx", this.commands.STOP_WEIGHT_MEAS, 0)
    } finally {
      this.measurementActive = false
    }
  }

  /**
   * Starts streaming data from the Frez Dyno.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream = async (duration = 0): Promise<void> => {
    this.measurementActive = false
    this.resetSessionData()
    this.resetPacketTracking()
    this.recentSampleTimestamps = []
    await this.ensureCalibrationLoaded()
    this.assertCanStartMeasurement()

    await this.write("frez-dyno", "tx", this.commands.START_WEIGHT_MEAS, 0)
    this.measurementActive = true

    if (duration !== 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, duration))
      await this.stop()
    }
  }
}
