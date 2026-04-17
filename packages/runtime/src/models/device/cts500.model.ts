import { CTS500 as CTS500Base } from "@hangtime/grip-connect"
import process from "node:process"
import { bluetooth } from "webbluetooth"
import { writeDownloadFile } from "../../download.js"

/**
 * Represents the Jlyscales CTS500 device.
 * {@link https://www.alibaba.com/product-detail/Mini-Climbing-Training-Scale-CTS500-Aluminum_1601637814595.html}
 */
export class CTS500 extends CTS500Base {
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
    if (typeof process !== "undefined" && process.versions?.node) {
      return bluetooth
    }

    throw new Error("Bluetooth not available.")
  }
}
