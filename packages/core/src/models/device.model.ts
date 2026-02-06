import { BaseModel } from "./../models/base.model.js"
import type { IDevice, Service } from "../interfaces/device.interface.js"
import type {
  ActiveCallback,
  ForceMeasurement,
  ForceUnit,
  NotifyCallback,
  WriteCallback,
} from "../interfaces/callback.interface.js"
import type { DownloadPacket } from "../interfaces/download.interface.js"
import type { Commands } from "../interfaces/command.interface.js"
import { convertForce, convertForceMeasurement } from "../utils.js"

export abstract class Device extends BaseModel implements IDevice {
  /**
   * Filters to identify the device during Bluetooth scanning.
   * Used to match devices that meet specific criteria such as name, service UUIDs, etc.
   * @type {BluetoothLEScanFilter[]}
   * @public
   * @readonly
   */
  readonly filters: BluetoothLEScanFilter[]

  /**
   * Array of services provided by the device.
   * Services represent functionalities that the device supports, such as weight measurement, battery information, or custom services.
   * @type {Service[]}
   * @public
   * @readonly
   */
  readonly services: Service[]

  /**
   * Reference to the `BluetoothDevice` object representing this device.
   * This is the actual device object obtained from the Web Bluetooth API after a successful connection.
   * @type {BluetoothDevice | undefined}
   * @public
   */
  bluetooth?: BluetoothDevice

  /**
   * Object representing the set of commands available for this device.
   * These commands allow communication with the device to perform various operations such as starting measurements, retrieving data, or calibrating the device.
   * @type {Commands}
   * @public
   * @readonly
   */
  readonly commands: Commands

  /**
   * The BluetoothRemoteGATTServer interface of the Web Bluetooth API represents a GATT Server on a remote device.
   * @type {BluetoothRemoteGATTServer | undefined}
   * @private
   */
  private server: BluetoothRemoteGATTServer | undefined

  /**
   * The last message written to the device.
   * @type {string | Uint8Array | null}
   * @protected
   */
  protected writeLast: string | Uint8Array | null = null
  /**
   * Indicates whether the device is currently active.
   * @type {boolean}
   */
  protected isActive = false
  /**
   * Configuration for threshold and duration.
   */
  private activeConfig: { threshold: number; duration: number } = {
    threshold: 2.5,
    duration: 1000,
  }

  /**
   * Highest instantaneous force (peak) recorded in the session; may be negative.
   * Initialized to Number.NEGATIVE_INFINITY so the first sample sets the peak.
   * @type {number}
   * @protected
   */
  protected peak: number

  /**
   * Mean (average) force over the session, initialized to 0.
   * @type {number}
   * @protected
   */
  protected mean: number

  /**
   * Display unit for force measurements (output unit for notify callbacks).
   * @type {ForceUnit}
   * @protected
   */
  protected unit: ForceUnit

  /**
   * Unit of the values streamed by the device (kg for most devices, lbs for ForceBoard).
   * @type {ForceUnit}
   * @protected
   */
  protected streamUnit: ForceUnit = "kg"

  /**
   * Optional sampling rate in Hz when known or calculated from notification timestamps.
   * @type {number | undefined}
   * @protected
   */
  protected samplingRateHz?: number

  /**
   * Start time of the current rate measurement interval.
   * @type {number}
   * @private
   */
  private rateIntervalStart = 0

  /**
   * Number of samples in the current rate measurement interval.
   * @type {number}
   * @private
   */
  private rateIntervalSamples = 0

  /**
   * Running sum of force values for the session.
   * Used to calculate mean (average) force.
   * @type {number}
   * @protected
   */
  protected sum: number

  /**
   * Number of data points received from the device.
   * Used to calculate the average mass.
   * @type {number}
   * @protected
   */
  protected dataPointCount: number

  /**
   * Array of DownloadPacket entries.
   * This array holds packets that contain data downloaded from the device.
   * @type {DownloadPacket[]}
   * @protected
   */
  protected downloadPackets: DownloadPacket[] = [] // Initialize an empty array of DownloadPacket entries

  /**
   * Represents the current tare value for calibration.
   * @type {number}
   */
  private tareCurrent = 0

  /**
   * Indicates whether the tare calibration process is active.
   * @type {boolean}
   */
  private tareActive = false

  /**
   * Timestamp when the tare calibration process started.
   * @type {number | null}
   */
  private tareStartTime: number | null = null

  /**
   * Array holding the samples collected during tare calibration.
   * @type {number[]}
   */
  private tareSamples: number[] = []

  /**
   * Duration time for the tare calibration process.
   * @type {number}
   */
  private tareDuration = 5000

  /**
   * Optional callback for handling mass/force data notifications.
   * @callback NotifyCallback
   * @param {ForceMeasurement} data - The force measurement passed to the callback.
   * @type {NotifyCallback | undefined}
   * @protected
   */
  protected notifyCallback: NotifyCallback = (data: ForceMeasurement) => console.log(data)

  /**
   * Optional callback for handling write operations.
   * @callback WriteCallback
   * @param {string} data - The data passed to the callback.
   * @type {WriteCallback | undefined}
   * @protected
   */
  protected writeCallback: WriteCallback = (data: string) => console.log(data)

  /**
   * Optional callback for handling write operations.
   * @callback ActiveCallback
   * @param {string} data - The data passed to the callback.
   * @type {ActiveCallback | undefined}
   * @protected
   */
  protected activeCallback: ActiveCallback = (data: boolean) => console.log(data)

  /**
   * Event listener for handling the 'gattserverdisconnected' event.
   * This listener delegates the event to the `onDisconnected` method.
   *
   * @private
   * @type {(event: Event) => void}
   */
  private onDisconnectedListener = (event: Event) => this.onDisconnected(event)

  /**
   * A map that stores notification event listeners keyed by characteristic UUIDs.
   * This allows for proper addition and removal of event listeners associated with each characteristic.
   *
   * @private
   * @type {Map<string, EventListener>}
   */
  private notificationListeners = new Map<string, EventListener>()

  constructor(device: Partial<IDevice>) {
    super(device)

    this.filters = device.filters || []
    this.services = device.services || []
    this.commands = device.commands || {}
    if (device.bluetooth !== undefined) {
      this.bluetooth = device.bluetooth
    }

    this.peak = Number.NEGATIVE_INFINITY
    this.mean = 0
    this.sum = 0
    this.dataPointCount = 0
    this.unit = "kg"

    // Reset sampling rate calculation state
    this.rateIntervalStart = 0
    this.rateIntervalSamples = 0

    this.createdAt = new Date()
    this.updatedAt = new Date()
  }

  /**
   * Builds a ForceMeasurement for a single zone (e.g. left/center/right).
   * With one argument, current/peak/mean are all set to that value.
   * With three arguments, uses the given current, peak, and mean for the zone.
   * @param valueOrCurrent - Force value, or current force for this zone
   * @param peak - Optional peak for this zone (required if mean is provided)
   * @param mean - Optional mean for this zone
   * @returns ForceMeasurement (no nested distribution)
   * @protected
   */
  protected buildZoneMeasurement(valueOrCurrent: number, peak?: number, mean?: number): ForceMeasurement {
    const useFullStats = peak !== undefined && mean !== undefined
    const current = valueOrCurrent
    const zonePeak = useFullStats ? (peak === 0 && current < 0 ? current : peak) : valueOrCurrent
    const zoneMean = useFullStats ? mean : valueOrCurrent
    const zone: ForceMeasurement = {
      unit: this.unit,
      timestamp: Date.now(),
      current,
      peak: zonePeak,
      mean: zoneMean,
    }
    if (this.samplingRateHz !== undefined) {
      zone.samplingRateHz = this.samplingRateHz
    }
    return zone
  }

  /**
   * Interval duration (ms) for sampling rate calculation.
   * @private
   * @readonly
   */
  private static readonly RATE_INTERVAL_MS = 1000

  /**
   * Calculates sampling rate: samples per second.
   * Uses fixed intervals to avoid sliding window edge effects.
   * @private
   */
  private updateSamplingRate(): void {
    const now = Date.now()

    if (this.rateIntervalStart === 0) {
      this.rateIntervalStart = now
    }

    this.rateIntervalSamples++

    const elapsed = now - this.rateIntervalStart
    if (elapsed >= Device.RATE_INTERVAL_MS) {
      this.samplingRateHz = Math.round((this.rateIntervalSamples / elapsed) * 1000)
      this.rateIntervalStart = now
      this.rateIntervalSamples = 0
    }
  }

  /**
   * Builds a ForceMeasurement payload with unit and timestamp for notify callbacks.
   * @param current - Current force at this sample
   * @param distribution - Optional zone distribution: numbers (converted via buildZoneMeasurement) or full ForceMeasurement per zone
   * @returns ForceMeasurement
   * @protected
   */
  protected buildForceMeasurement(
    current: number,
    distribution?: {
      left?: ForceMeasurement
      center?: ForceMeasurement
      right?: ForceMeasurement
    },
  ): ForceMeasurement {
    this.updateSamplingRate()
    const payload: ForceMeasurement = {
      unit: this.unit,
      timestamp: Date.now(),
      current: convertForce(current, this.streamUnit, this.unit),
      peak: convertForce(this.peak, this.streamUnit, this.unit),
      mean: convertForce(this.mean, this.streamUnit, this.unit),
    }
    if (this.samplingRateHz !== undefined) {
      payload.samplingRateHz = this.samplingRateHz
    }
    if (
      distribution !== undefined &&
      (distribution.left !== undefined || distribution.center !== undefined || distribution.right !== undefined)
    ) {
      payload.distribution = {}
      if (distribution.left !== undefined) {
        payload.distribution.left = convertForceMeasurement(distribution.left, this.streamUnit, this.unit)
      }
      if (distribution.center !== undefined) {
        payload.distribution.center = convertForceMeasurement(distribution.center, this.streamUnit, this.unit)
      }
      if (distribution.right !== undefined) {
        payload.distribution.right = convertForceMeasurement(distribution.right, this.streamUnit, this.unit)
      }
    }
    return payload
  }

  /**
   * Sets the callback function to be called when the activity status changes,
   * and optionally sets the configuration for threshold and duration.
   *
   * This function allows you to specify a callback that will be invoked whenever
   * the activity status changes, indicating whether the device is currently active.
   * It also allows optionally configuring the threshold and duration used to determine activity.
   *
   * @param {ActiveCallback} callback - The callback function to be set. This function
   *                                      receives a boolean value indicating the new activity status.
   * @param {object} [options] - Optional configuration object containing the threshold and duration.
   * @param {number} [options.threshold=2.5] - The threshold value for determining activity.
   * @param {number} [options.duration=1000] - The duration (in milliseconds) to monitor the input for activity.
   * @returns {void}
   * @public
   *
   * @example
   * device.active((isActive) => {
   *   console.log(`Device is ${isActive ? 'active' : 'inactive'}`);
   * }, { threshold: 3.0, duration: 1500 });
   */
  active = (callback: ActiveCallback, options?: { threshold?: number; duration?: number }): void => {
    this.activeCallback = callback

    // Update the config values only if provided, otherwise use defaults
    this.activeConfig = {
      threshold: options?.threshold ?? this.activeConfig.threshold, // Use new threshold if provided, else use default
      duration: options?.duration ?? this.activeConfig.duration, // Use new duration if provided, else use default
    }
  }

  /**
   * Checks if a dynamic value is active based on a threshold and duration.
   *
   * This function assesses whether a given dynamic value surpasses a specified threshold
   * and remains active for a specified duration. If the activity status changes from
   * the previous state, the callback function is called with the updated activity status.
   *
   * @param {number} input - The dynamic value to check for activity status.
   * @returns {Promise<void>} A promise that resolves once the activity check is complete.
   *
   * @example
   * await device.activityCheck(5.0);
   */
  protected activityCheck = async (input: number): Promise<void> => {
    const startValue = input
    const { threshold, duration } = this.activeConfig
    // After waiting for `duration`, check if still active.
    await new Promise((resolve) => setTimeout(resolve, duration))
    const activeNow = startValue > threshold
    if (this.isActive !== activeNow) {
      this.isActive = activeNow
      this.activeCallback?.(activeNow)
    }
  }

  /**
   * Connects to a Bluetooth device.
   * @param {Function} [onSuccess] - Optional callback function to execute on successful connection. Default logs success.
   * @param {Function} [onError] - Optional callback function to execute on error. Default logs the error.
   * @public
   *
   * @example
   * device.connect(
   *   () => console.log("Connected successfully"),
   *   (error) => console.error("Connection failed:", error)
   * );
   */
  connect = async (
    onSuccess: () => void = () => console.log("Connected successfully"),
    onError: (error: Error) => void = (error) => console.error(error),
  ): Promise<void> => {
    try {
      // Request device and set up connection
      const deviceServices = this.getAllServiceUUIDs()

      const bluetooth = await this.getBluetooth()

      // Experiment: Reconnect to known devices, enable these Chrome flags:
      // - chrome://flags/#enable-experimental-web-platform-features → enables getDevices() API
      // - chrome://flags/#enable-web-bluetooth-new-permissions-backend → ensures it returns all permitted devices, not just connected ones
      // let reconnectDevice: BluetoothDevice | undefined
      // if (typeof bluetooth.getDevices === "function") {
      //   const devices: BluetoothDevice[] = await bluetooth.getDevices()
      //   if (devices.length > 0 && this.filters.length > 0) {
      //     reconnectDevice = devices.find((device) => {
      //       if (!device.name) return false
      //       const d = device
      //       return this.filters.some(
      //         (f) => (f.name && d.name === f.name) || (f.namePrefix && d.name?.startsWith(f.namePrefix)),
      //       )
      //     })
      //   }
      //   if (reconnectDevice) {
      //     this.bluetooth = reconnectDevice
      //     // It's currently impossible to call this.bluetooth.gatt.connect() here.
      //     // After restarting the Browser, it will always give: "Bluetooth Device is no longer in range."
      //   }
      // }

      this.bluetooth = await bluetooth.requestDevice({
        filters: this.filters,
        optionalServices: deviceServices,
      })

      if (!this.bluetooth.gatt) {
        throw new Error("GATT is not available on this device")
      }

      this.bluetooth.addEventListener("gattserverdisconnected", this.onDisconnectedListener)

      this.server = await this.bluetooth.gatt.connect()

      if (this.server.connected) {
        await this.onConnected(onSuccess)
      }
    } catch (error) {
      onError(error as Error)
    }
  }

  /**
   * Disconnects the device if it is currently connected.
   * - Removes all notification listeners from the device's characteristics.
   * - Removes the 'gattserverdisconnected' event listener.
   * - Attempts to gracefully disconnect the device's GATT server.
   * - Resets relevant properties to their initial states.
   * @returns {void}
   * @public
   *
   * @example
   * device.disconnect();
   */
  disconnect = (): void => {
    if (this.isConnected()) {
      this.updateTimestamp()
      // Remove all notification listeners
      this.services.forEach((service) => {
        service.characteristics.forEach((char) => {
          // Look for the "rx" characteristic that accepts notifications
          if (char.characteristic && char.id === "rx") {
            char.characteristic.stopNotifications()
            const listener = this.notificationListeners.get(char.uuid)
            if (listener) {
              char.characteristic.removeEventListener("characteristicvaluechanged", listener)
              this.notificationListeners.delete(char.uuid)
            }
          }
        })
      })
      // Remove disconnect listener
      this.bluetooth?.removeEventListener("gattserverdisconnected", this.onDisconnectedListener)
      // Safely attempt to disconnect the device's GATT server, if available
      this.bluetooth?.gatt?.disconnect()
      // Reset properties
      this.server = undefined
      this.writeLast = null
      this.isActive = false
    }
  }

  /**
   * Converts the `downloadPackets` array into a CSV formatted string.
   * @returns {string} A CSV string representation of the `downloadPackets` data, with each packet on a new line.
   * @private
   *
   * @example
   * const csvData = device.downloadToCSV();
   * console.log(csvData);
   */
  protected downloadToCSV = (): string => {
    const packets = [...this.downloadPackets]
    if (packets.length === 0) {
      return ""
    }
    return packets
      .map((packet) =>
        [
          packet.received.toString(),
          packet.sampleNum.toString(),
          packet.battRaw.toString(),
          ...packet.samples.map(String),
          ...packet.masses.map(String),
        ]
          .map((v) => v.replace(/"/g, '""'))
          .map((v) => `"${v}"`)
          .join(","),
      )
      .join("\r\n")
  }

  /**
   * Converts an array of DownloadPacket objects to a JSON string.
   * @returns {string} JSON string representation of the data.
   * @private
   *
   * @example
   * const jsonData = device.downloadToJSON();
   * console.log(jsonData);
   */
  protected downloadToJSON = (): string => {
    // Pretty print JSON with 2-space indentation
    return JSON.stringify(this.downloadPackets, null, 2)
  }

  /**
   * Converts an array of DownloadPacket objects to an XML string.
   * @returns {string}  XML string representation of the data.
   * @private
   *
   * @example
   * const xmlData = device.downloadToXML();
   * console.log(xmlData);
   */
  protected downloadToXML = (): string => {
    const xmlPackets = this.downloadPackets
      .map((packet) => {
        const samples = packet.samples.map((sample) => `<sample>${sample}</sample>`).join("")
        const masses = packet.masses.map((mass) => `<mass>${mass}</mass>`).join("")
        return `
          <packet>
            <received>${packet.received}</received>
            <sampleNum>${packet.sampleNum}</sampleNum>
            <battRaw>${packet.battRaw}</battRaw>
            <samples>${samples}</samples>
            <masses>${masses}</masses>
          </packet>
        `
      })
      .join("")
    return `<DownloadPackets>${xmlPackets}</DownloadPackets>`
  }

  /**
   * Exports the data in the specified format (CSV, JSON, XML) with a filename format:
   * 'data-export-YYYY-MM-DD-HH-MM-SS.{format}'.
   *
   * @param {('csv' | 'json' | 'xml')} [format='csv'] - The format in which to download the data.
   * Defaults to 'csv'. Accepted values are 'csv', 'json', and 'xml'.
   *
   * @returns {Promise<void>} Resolves when the data has been downloaded/written
   * @public
   *
   * @example
   * await device.download('json');
   */
  download = async (format: "csv" | "json" | "xml" = "csv"): Promise<void> => {
    let content = ""

    if (format === "csv") {
      content = this.downloadToCSV()
    } else if (format === "json") {
      content = this.downloadToJSON()
    } else if (format === "xml") {
      content = this.downloadToXML()
    }

    const now = new Date()
    // YYYY-MM-DD
    const date = now.toISOString().split("T")[0]
    // HH-MM-SS
    const time = now.toTimeString().split(" ")[0].replace(/:/g, "-")

    const fileName = `data-export-${date}-${time}.${format}`

    const mimeTypes = {
      csv: "text/csv",
      json: "application/json",
      xml: "application/xml",
    }

    // Create a Blob object containing the data
    const blob = new Blob([content], { type: mimeTypes[format] })
    // Create a URL for the Blob
    const url = globalThis.URL.createObjectURL(blob)

    // Create a link element
    const link = document.createElement("a")

    // Set link attributes
    link.href = url
    link.setAttribute("download", fileName)

    // Append link to document body
    document.body.appendChild(link)

    // Programmatically click the link to trigger the download
    link.click()

    // Clean up: remove the link and revoke the URL
    document.body.removeChild(link)
    globalThis.URL.revokeObjectURL(url)
  }

  /**
   * Returns UUIDs of all services associated with the device.
   * @returns {string[]} Array of service UUIDs.
   * @protected
   *
   * @example
   * const serviceUUIDs = device.getAllServiceUUIDs();
   * console.log(serviceUUIDs);
   */
  protected getAllServiceUUIDs = (): string[] => {
    return this.services.filter((service) => service?.uuid).map((service) => service.uuid)
  }

  /**
   * Returns the Bluetooth instance available for the current environment.
   * In browsers, it returns the native Web Bluetooth API (i.e. `navigator.bluetooth`).
   * In a Node, Bun, or Deno environment, it dynamically imports the `webbluetooth` package.
   * {@link https://github.com/thegecko/webbluetooth}
   *
   * @returns {Promise<Bluetooth>} A promise that resolves to the Bluetooth instance.
   * @throws {Error} If Web Bluetooth is not available in the current environment.
   */
  protected async getBluetooth(): Promise<Bluetooth> {
    // If running in a browser with native Web Bluetooth support:
    if (typeof navigator !== "undefined" && navigator.bluetooth) {
      return navigator.bluetooth
    }
    // If none of the above conditions are met, throw an error.
    throw new Error("Bluetooth not available.")
  }

  /**
   * Handles notifications received from a characteristic.
   * @param {DataView} value - The notification event.
   *
   * @example
   * device.handleNotifications(someCharacteristic);
   */
  protected handleNotifications = (value: DataView): void => {
    if (!value) return

    this.updateTimestamp()
    // Received notification data
    console.log(value)
  }

  /**
   * Checks if a Bluetooth device is connected.
   * @returns {boolean} A boolean indicating whether the device is connected.
   * @public
   *
   * @example
   * if (device.isConnected()) {
   *   console.log('Device is connected');
   * } else {
   *   console.log('Device is not connected');
   * }
   */
  isConnected = (): boolean => {
    // Check if the device is defined and available
    if (!this.bluetooth) {
      return false
    }
    // Check if the device is connected
    return !!this.bluetooth.gatt?.connected
  }

  /**
   * Sets the callback function to be called when notifications are received.
   * @param {NotifyCallback} callback - The callback function to be set.
   * @param {ForceUnit} [unit="kg"] - Optional display unit for force values in the callback payload.
   * @returns {void}
   * @public
   *
   * @example
   * device.notify((data) => {
   *   console.log('Received notification:', data);
   * });
   * device.notify((data) => { ... }, 'lbs');
   */
  notify = (callback: NotifyCallback, unit?: ForceUnit): void => {
    this.unit = unit ?? "kg"
    this.notifyCallback = callback
  }

  /**
   * Handles the 'connected' event.
   * @param {Function} onSuccess - Callback function to execute on successful connection.
   * @public
   *
   * @example
   * device.onConnected(() => {
   *   console.log('Device connected successfully');
   * });
   */
  protected onConnected = async (onSuccess: () => void): Promise<void> => {
    this.updateTimestamp()

    if (!this.server) {
      throw new Error("GATT server is not available")
    }
    // Connect to GATT server and set up characteristics
    const services: BluetoothRemoteGATTService[] = await this.server.getPrimaryServices()

    if (!services || services.length === 0) {
      throw new Error("No services found")
    }

    for (const service of services) {
      const matchingService = this.services.find((boardService) => boardService.uuid === service.uuid)

      if (matchingService) {
        // Android bug: Add a small delay before getting characteristics
        await new Promise((resolve) => setTimeout(resolve, 100))

        const characteristics = await service.getCharacteristics()

        for (const characteristic of matchingService.characteristics) {
          const matchingCharacteristic = characteristics.find((char) => char.uuid === characteristic.uuid)

          if (matchingCharacteristic) {
            // Find the corresponding characteristic descriptor in the service's characteristics array
            const descriptor = matchingService.characteristics.find((char) => char.uuid === matchingCharacteristic.uuid)
            if (descriptor) {
              // Assign the actual Bluetooth characteristic object to the descriptor so it can be used later
              descriptor.characteristic = matchingCharacteristic
              // Look for the "rx" characteristic id that accepts notifications
              if (descriptor.id === "rx") {
                // Start receiving notifications for changes on this characteristic
                matchingCharacteristic.startNotifications()
                // Triggered when the characteristic's value changes
                const listener = (event: Event) => {
                  // Cast the event's target to a BluetoothRemoteGATTCharacteristic to access its properties
                  const target = event.target as BluetoothRemoteGATTCharacteristic
                  if (target && target.value) {
                    // Delegate the data to handleNotifications method
                    this.handleNotifications(target.value)
                  }
                }
                // Attach the event listener to listen for changes in the characteristic's value
                matchingCharacteristic.addEventListener("characteristicvaluechanged", listener)
                // Store the listener so it can be referenced (for later removal)
                this.notificationListeners.set(descriptor.uuid, listener)
              }
            }
          } else {
            throw new Error(`Characteristic ${characteristic.uuid} not found in service ${service.uuid}`)
          }
        }
      }
    }
    // Call the onSuccess callback after successful connection and setup
    onSuccess()
  }

  /**
   * Handles the 'disconnected' event.
   * @param {Event} event - The 'disconnected' event.
   * @public
   *
   * @example
   * device.onDisconnected(event);
   */
  protected onDisconnected = (event: Event): void => {
    console.warn(`Device ${(event.target as BluetoothDevice).name} is disconnected.`)
    this.disconnect()
  }

  /**
   * Reads the value of the specified characteristic from the device.
   * @param {string} serviceId - The service ID where the characteristic belongs.
   * @param {string} characteristicId - The characteristic ID to read from.
   * @param {number} [duration=0] - The duration to wait before resolving the promise, in milliseconds.
   * @returns {Promise<string | undefined>} A promise that resolves when the read operation is completed.
   * @public
   *
   * @example
   * const value = await device.read('battery', 'level', 1000);
   * console.log('Battery level:', value);
   */
  read = async (serviceId: string, characteristicId: string, duration = 0): Promise<string | undefined> => {
    if (!this.isConnected()) {
      return undefined
    }
    // Get the characteristic from the service
    const characteristic = this.services
      .find((service) => service.id === serviceId)
      ?.characteristics.find((char) => char.id === characteristicId)?.characteristic

    if (!characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }
    this.updateTimestamp()
    // Decode the value based on characteristicId and serviceId
    let decodedValue: string
    const decoder = new TextDecoder("utf-8")
    // Read the value from the characteristic
    const value = await characteristic.readValue()

    if (
      (serviceId === "battery" || serviceId === "humidity" || serviceId === "temperature") &&
      characteristicId === "level"
    ) {
      // This is battery-specific; return the first byte as the level
      decodedValue = value.getUint8(0).toString()
    } else {
      // Otherwise use a UTF-8 decoder
      decodedValue = decoder.decode(value)
    }
    // Wait for the specified duration before returning the result
    if (duration > 0) {
      await new Promise((resolve) => setTimeout(resolve, duration))
    }

    return decodedValue
  }

  /**
   * Initiates the tare calibration process.
   * @param {number} duration - The duration time for tare calibration.
   * @returns {boolean} A boolean indicating whether the tare calibration was successful.
   * @public
   *
   * @example
   * const success = device.tare(5000);
   * if (success) {
   *   console.log('Tare calibration started');
   * } else {
   *   console.log('Tare calibration failed to start');
   * }
   */
  tare(duration = 5000): boolean {
    if (this.tareActive) return false
    this.updateTimestamp()
    this.tareActive = true
    this.tareDuration = duration
    this.tareSamples = []
    this.tareStartTime = Date.now()
    return true
  }

  /**
   * Apply tare calibration to the provided sample.
   * @param {number} sample - The sample to calibrate.
   * @returns {number} The calibrated tare value.
   * @protected
   *
   * @example
   * const calibratedSample = device.applyTare(rawSample);
   * console.log('Calibrated sample:', calibratedSample);
   */
  protected applyTare(sample: number): number {
    if (this.tareActive && this.tareStartTime) {
      // Add current sample to the tare samples array
      this.tareSamples.push(sample)

      // Check if the tare calibration duration has passed
      if (Date.now() - this.tareStartTime >= this.tareDuration) {
        // Calculate the average of the tare samples
        const total = this.tareSamples.reduce((acc, sample) => acc + sample, 0)
        this.tareCurrent = total / this.tareSamples.length

        // Reset the tare calibration process
        this.tareActive = false
        this.tareStartTime = null
        this.tareSamples = []
      }
    }
    // Return the current tare-adjusted value
    return this.tareCurrent
  }

  /**
   * Updates the timestamp of the last device interaction.
   * This method sets the updatedAt property to the current date and time.
   * @protected
   *
   * @example
   * device.updateTimestamp();
   * console.log('Last updated:', device.updatedAt);
   */
  protected updateTimestamp = (): void => {
    this.updatedAt = new Date()
  }

  /**
   * Writes a message to the specified characteristic of a Bluetooth device and optionally provides a callback to handle responses.
   * @param {string} serviceId - The service UUID of the Bluetooth device containing the target characteristic.
   * @param {string} characteristicId - The characteristic UUID where the message will be written.
   * @param {string | Uint8Array | undefined} message - The message to be written to the characteristic. It can be a string or a Uint8Array.
   * @param {number} [duration=0] - Optional. The time in milliseconds to wait before resolving the promise. Defaults to 0 for immediate resolution.
   * @param {WriteCallback} [callback=writeCallback] - Optional. A custom callback to handle the response after the write operation is successful.
   * @returns {Promise<void>} A promise that resolves once the write operation is complete.
   * @public
   * @throws {Error} Throws an error if the characteristic is undefined.
   *
   * @example
   * // Example usage of the write function with a custom callback
   * await Progressor.write("progressor", "tx", ProgressorCommands.GET_BATT_VLTG, 250, (data) => {
   *   console.log(`Battery voltage: ${data}`);
   * });
   */
  write = async (
    serviceId: string,
    characteristicId: string,
    message: string | Uint8Array | undefined,
    duration = 0,
    callback: WriteCallback = this.writeCallback,
  ): Promise<void> => {
    // Check if not connected or no message is provided
    if (!this.isConnected() || message === undefined) {
      return Promise.resolve()
    }
    // Get the characteristic from the service
    const characteristic = this.services
      .find((service) => service.id === serviceId)
      ?.characteristics.find((char) => char.id === characteristicId)?.characteristic

    if (!characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }
    this.updateTimestamp()
    // Convert the message to Uint8Array if it's a string
    const valueToWrite =
      typeof message === "string" ? new Uint8Array(new TextEncoder().encode(message)) : new Uint8Array(message)
    // Write the value to the characteristic
    await characteristic.writeValue(valueToWrite)
    // Update the last written message
    this.writeLast = message
    // Assign the provided callback to `writeCallback`
    this.writeCallback = callback
    // If a duration is specified, resolve the promise after the duration
    if (duration > 0) {
      await new Promise<void>((resolve) => setTimeout(resolve, duration))
    }
  }
}
