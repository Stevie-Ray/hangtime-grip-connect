/**
 * `grip-connect download [device]` -- exports session data to a file.
 */

import type { Command } from "commander"
import { parseExportFormat } from "../parsers.js"
import { runDownloadSession } from "../services/session.js"
import { resolveDeviceKey, createDevice, connectAndRun, resolveContext } from "../utils.js"

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
      const format = parseExportFormat(options.format)

      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      await connectAndRun(device, name, async (d) => runDownloadSession(d, format, ctx), ctx, {
        setupDefaultNotify: false,
      })
    })
}
