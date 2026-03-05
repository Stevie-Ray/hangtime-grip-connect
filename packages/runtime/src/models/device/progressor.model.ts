import { Progressor as ProgressorBase } from "@hangtime/grip-connect"
import process from "node:process"
import { bluetooth } from "webbluetooth"
import { writeDownloadFile } from "../../download.js"

/**
 * Represents a Tindeq Progressor device.
 * {@link https://tindeq.com}
 */
export class Progressor extends ProgressorBase {
  override download = async (format: "csv" | "json" | "xml" = "csv"): Promise<void> => {
    let content = ""

    if (format === "csv") {
      content = this.downloadToCSV()
    } else if (format === "json") {
      content = this.downloadToJSON()
    } else if (format === "xml") {
      content = this.downloadToXML()
    }

    return writeDownloadFile(format, content)
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
