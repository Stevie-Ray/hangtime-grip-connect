import { Motherboard as MotherboardBase } from "@hangtime/grip-connect"
import { writeFile } from "node:fs/promises"
import process from "node:process"
import { bluetooth } from "webbluetooth"

/**
 * Represents a Griptonite Motherboard device.
 * {@link https://griptonite.io}
 */
export class Motherboard extends MotherboardBase {
  override download = async (format: "csv" | "json" | "xml" = "csv"): Promise<void> => {
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

    await writeFile(fileName, content)
    console.log(`File saved as ${fileName}`)
  }

  protected override async getBluetooth(): Promise<Bluetooth> {
    // If running in Node, Bun, or Deno environment
    if (typeof process !== "undefined" && process.versions?.node) {
      return bluetooth
    }

    // If none of the above conditions are met, throw an error.
    throw new Error("Bluetooth not available.")
  }
}
