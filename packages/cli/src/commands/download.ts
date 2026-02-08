/**
 * `grip-connect download [device]` -- exports session data to a file.
 */

import type { Command } from "commander"
import { resolveDeviceKey, createDevice, connectAndRun, resolveContext, printSuccess, fail } from "../utils.js"

/**
 * Registers the `download` command on the Commander program.
 *
 * @param program - The root Commander program.
 */
export function registerDownload(program: Command): void {
  program
    .command("download [device]")
    .description("Connect and export session data")
    .option("-f, --format <format>", "Export format: csv, json, xml", "csv")
    .option("-o, --output <dir>", "Output directory for the exported file")
    .action(async (deviceKey: string | undefined, options: { format: string; output?: string }) => {
      const ctx = resolveContext(program)
      const format = options.format.toLowerCase() as "csv" | "json" | "xml"
      if (!["csv", "json", "xml"].includes(format)) {
        fail("Format must be csv, json, or xml.")
      }

      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      await connectAndRun(
        device,
        name,
        async (d) => {
          if (typeof d.download !== "function") {
            fail("Download not supported on this device.")
          }
          const filePath = await d.download(format)
          if (!ctx.json) {
            printSuccess(
              typeof filePath === "string"
                ? `Session data exported to ${filePath}`
                : `Session data exported as ${format.toUpperCase()}.`,
            )
          }
        },
        ctx,
      )
    })
}
