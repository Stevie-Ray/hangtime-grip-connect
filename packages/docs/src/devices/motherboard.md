### Basic Usage

```ts
import { Motherboard } from "@hangtime/grip-connect"

const device = new Motherboard()
```

### Device features

See [Devices](/devices/) for default device features.

```ts
/**
   * Applies calibration to a sample value.
   * @param {number} sample - The sample value to calibrate.
   * @param {number[][]} calibration - The calibration data.
   * @returns {number} The calibrated sample value.
   */
  applyCalibration(sample: number, calibration: number[][]): number

  /**
   * Retrieves battery or voltage information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the battery or voltage information.
   */
  battery(): Promise<string | undefined>

  /**
   * Writes a command to get calibration data from the device.
   * @returns {Promise<void>} A Promise that resolves when the command is successfully sent.
   */
  calibration(): Promise<void>

  /**
   * Retrieves firmware version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the firmware version.
   */
  firmware(): Promise<string | undefined>

  /**
   * Retrieves hardware version from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the hardware version.
   */
  hardware(): Promise<string | undefined>

  /**
   * Sets the LED color based on a single color option.
   * @param {"green" | "red" | "orange"} [config] - Optional color for the LEDs.
   * @returns {Promise<number[] | undefined>} A promise that resolves with the payload array for the Kilter Board if LED settings were applied.
   */
  led(config?: "green" | "red" | "orange"): Promise<number[] | undefined>

  /**
   * Retrieves manufacturer information from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the manufacturer information.
   */
  manufacturer(): Promise<string | undefined>

  /**
   * Retrieves serial number from the device.
   * @returns {Promise<string | undefined>} A Promise that resolves with the serial number.
   */
  serial(): Promise<string | undefined>

  /**
   * Starts streaming data from the specified device.
   * @param {number} [duration=0] - The duration of the stream in milliseconds. If set to 0, stream will continue indefinitely.
   * @returns {Promise<void>} A promise that resolves when the streaming operation is completed.
   */
  stream(duration?: number): Promise<void>
```
