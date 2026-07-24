import { FrezDyno as FrezDynoBase, type FrezDynoOptions } from "@hangtime/grip-connect"
import process from "node:process"
import { bluetooth } from "webbluetooth"
import { writeDownloadFile } from "../../download.js"

/** Represents a Frez Dyno using the runtime Bluetooth transport. */
export class FrezDyno extends FrezDynoBase {
  constructor(options: FrezDynoOptions = {}) {
    super(options)
  }

  override download = async (format: "csv" | "json" | "xml" = "csv"): Promise<void> => {
    const content =
      format === "json" ? this.downloadToJSON() : format === "xml" ? this.downloadToXML() : this.downloadToCSV()
    return writeDownloadFile(format, content)
  }

  protected override async getBluetooth(): Promise<Bluetooth> {
    if (typeof process !== "undefined" && process.versions?.node) {
      return bluetooth
    }

    throw new Error("Bluetooth not available.")
  }
}
