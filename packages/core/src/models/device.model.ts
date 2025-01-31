import { BaseModel } from "./../models/base.model.js"
import type { IDevice, Service } from "../interfaces/device.interface.js"
import type { ActiveCallback, massObject, NotifyCallback, WriteCallback } from "../interfaces/callback.interface.js"
import type { DownloadPacket } from "../interfaces/download.interface.js"
import type { Commands } from "../interfaces/command.interface.js"

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
  bluetooth?: BluetoothDevice | undefined

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
   * Maximum mass recorded from the device, initialized to "0".
   * @type {string}
   * @protected
   */
  protected massMax: string

  /**
   * Average mass calculated from the device data, initialized to "0".
   * @type {string}
   * @protected
   */
  protected massAverage: string

  /**
   * Total sum of all mass data points recorded from the device.
   * Used to calculate the average mass.
   * @type {number}
   * @protected
   */
  protected massTotalSum: number

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
   * Optional callback for handling write operations.
   * @callback NotifyCallback
   * @param {massObject} data - The data passed to the callback.
   * @type {NotifyCallback | undefined}
   * @protected
   */
  protected notifyCallback: NotifyCallback = (data: massObject) => console.log(data)

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
    this.bluetooth = device.bluetooth

    this.massMax = "0"
    this.massAverage = "0"
    this.massTotalSum = 0
    this.dataPointCount = 0

    this.createdAt = new Date()
    this.updatedAt = new Date()
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
  protected activityCheck = (input: number): Promise<void> => {
    return new Promise((resolve) => {
      const startValue = input
      const { threshold, duration } = this.activeConfig
      setTimeout(() => {
        // After waiting for `duration`, check if still active (for a real scenario, you might store a last known input)
        const activeNow = startValue > threshold
        if (this.isActive !== activeNow) {
          this.isActive = activeNow
          if (this.activeCallback) {
            this.activeCallback(activeNow)
          }
        }
        resolve()
      }, duration)
    })
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
          // TODO: remove device-specific logic
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
  private downloadToCSV = (): string => {
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
  private downloadToJSON = (): string => {
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
  private downloadToXML = (): string => {
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

    if (typeof window !== "undefined" && typeof document !== "undefined") {
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
    } else {
      const { writeFile } = await import("node:fs/promises")
      await writeFile(fileName, content)
      console.log(`File saved as ${fileName}`)
    }
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
   * Attempt to use ES module import rather than require.
   * This approach uses an async dynamic import for `webbluetooth`,
   * so we can fallback if `navigator.bluetooth` is unavailable.
   */
  protected async getBluetooth() {
    // If we're in a browser with real Web Bluetooth available:
    if (typeof navigator !== "undefined" && "bluetooth" in navigator) {
      return navigator.bluetooth
    }

    // Otherwise, we're likely in Node or an environment without `navigator.bluetooth`.
    // Use a dynamic import for the ESM version:
    const { bluetooth } = await import("webbluetooth")
    return bluetooth
  }

  /**
   * Retrieves the characteristic from the device's service.
   * @param {string} serviceId - The UUID of the service.
   * @param {string} characteristicId - The UUID of the characteristic.
   * @returns {BluetoothRemoteGATTCharacteristic | undefined} The characteristic, if found.
   * @protected
   *
   * @example
   * const characteristic = device.getCharacteristic('battery', 'level');
   * if (characteristic) {
   *   console.log('Characteristic found');
   * }
   */
  protected getCharacteristic = (
    serviceId: string,
    characteristicId: string,
  ): BluetoothRemoteGATTCharacteristic | undefined => {
    // Find the service with the specified serviceId
    const boardService = this.services.find((service) => service.id === serviceId)
    if (boardService) {
      // If the service is found, find the characteristic with the specified characteristicId
      const boardCharacteristic = boardService.characteristics.find(
        (characteristic) => characteristic.id === characteristicId,
      )
      if (boardCharacteristic) {
        // If the characteristic is found, return it
        return boardCharacteristic.characteristic
      }
    }
    // Return undefined if the service or characteristic is not found
    return undefined
  }

  /**
   * Handles notifications received from a characteristic.
   * @param {BluetoothRemoteGATTCharacteristic} characteristic - The notification event.
   *
   * @example
   * device.handleNotifications(someCharacteristic);
   */
  protected handleNotifications = (characteristic: BluetoothRemoteGATTCharacteristic): void => {
    const value = characteristic.value
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
    if (!this?.bluetooth) {
      return false
    }
    // Check if the device is connected
    return !!this.bluetooth.gatt?.connected
  }

  /**
   * Sets the callback function to be called when notifications are received.
   * @param {NotifyCallback} callback - The callback function to be set.
   * @returns {void}
   * @public
   *
   * @example
   * device.notify((data) => {
   *   console.log('Received notification:', data);
   * });
   */
  notify = (callback: NotifyCallback): void => {
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
    const services: BluetoothRemoteGATTService[] | undefined = await this.server.getPrimaryServices()

    if (!services || services.length === 0) {
      throw new Error("No services found")
    }

    for (const service of services) {
      const matchingService = this.services.find((boardService) => boardService.uuid === service.uuid)

      if (matchingService) {
        // Android bug: Introduce a delay before getting characteristics
        await new Promise((resolve) => setTimeout(resolve, 100))

        const characteristics = await service.getCharacteristics()

        for (const characteristic of matchingService.characteristics) {
          const matchingCharacteristic = characteristics.find((char) => char.uuid === characteristic.uuid)

          if (matchingCharacteristic) {
            const element = matchingService.characteristics.find((char) => char.uuid === matchingCharacteristic.uuid)
            if (element) {
              element.characteristic = matchingCharacteristic

              // TODO: remove device-specific logic
              if (element.id === "rx") {
                matchingCharacteristic.startNotifications()
                const listener = (event: Event) => {
                  const target = event.target as BluetoothRemoteGATTCharacteristic
                  if (target && target.value) {
                    this.handleNotifications(target)
                  }
                }
                matchingCharacteristic.addEventListener("characteristicvaluechanged", listener)
                this.notificationListeners.set(element.uuid, listener)
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
    const characteristic = this.getCharacteristic(serviceId, characteristicId)
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
    const characteristic = this.getCharacteristic(serviceId, characteristicId)
    if (!characteristic) {
      throw new Error(`Characteristic "${characteristicId}" not found in service "${serviceId}"`)
    }
    this.updateTimestamp()
    // Convert the message to Uint8Array if it's a string
    const valueToWrite: Uint8Array = typeof message === "string" ? new TextEncoder().encode(message) : message
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
