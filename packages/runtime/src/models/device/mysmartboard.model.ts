import { mySmartBoard as mySmartBoardBase } from "@hangtime/grip-connect"
import process from "node:process"
import { bluetooth } from "webbluetooth"
import { writeDownloadFile } from "../../download.js"

/**
 * Represents a Smartboard Climbing mySmartBoard device.
 * TODO: Add services, do you own a mySmartBoard? Help us!
 * {@link https://www.smartboard-climbing.com}
 */
export class mySmartBoard extends mySmartBoardBase {
  override download = async (format: "csv" | "json" | "xml" = "csv"): Promise<string> => {
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
