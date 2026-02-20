import pc from "picocolors"
import { runLiveDataSession } from "../../services/session.js"
import type { Action, CliDevice, RunOptions } from "../../types.js"
import { ensureTaredForStreamAction } from "./shared.js"

export function buildLiveDataAction(): Action {
  return {
    name: "Live Data",
    description: "Just the raw data visualised in real-time",
    run: async (device: CliDevice, options: RunOptions) => {
      await ensureTaredForStreamAction(device, options)

      const duration = options.stream?.durationMs
      const indefinite = duration == null || duration === 0
      const outCtx = options.ctx ?? { json: false, unit: "kg" }

      if (!outCtx.json) {
        console.log(pc.cyan(indefinite ? "\nLive Data...\n" : `\nLive Data for ${(duration ?? 0) / 1000} seconds...\n`))
      }

      await runLiveDataSession(device, outCtx, {
        durationMs: duration,
        askDownload: false,
        format: options.export?.format,
      })
    },
  }
}
