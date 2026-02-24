import pc from "picocolors"
import { setTranslationLanguage, t } from "../interactive/translations.js"
import { runLiveDataSession } from "../../services/session.js"
import type { Action, CliDevice, RunOptions } from "../../types.js"
import { ensureTaredForStreamAction } from "./shared.js"

export function buildLiveDataAction(): Action {
  return {
    actionId: "live-data",
    name: "Live Data",
    description: "Just the raw data visualised in real-time",
    run: async (device: CliDevice, options: RunOptions) => {
      await ensureTaredForStreamAction(device, options)

      const duration = options.stream?.durationMs
      const indefinite = duration == null || duration === 0
      const outCtx = options.ctx ?? { json: false, unit: "kg", language: "en" }
      setTranslationLanguage(outCtx.language)

      if (!outCtx.json) {
        console.log(
          pc.cyan(
            indefinite
              ? `\n${t("menu.live-data-title")}\n`
              : `\n${t("menu.live-data-for-seconds", { seconds: (duration ?? 0) / 1000 })}\n`,
          ),
        )
      }

      await runLiveDataSession(device, outCtx, {
        durationMs: duration,
        askDownload: false,
        format: options.export?.format,
      })
    },
  }
}
