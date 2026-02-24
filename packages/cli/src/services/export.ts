import input from "@inquirer/input"
import select from "@inquirer/select"
import pc from "picocolors"
import { setTranslationLanguage, t } from "../menus/interactive/translations.js"
import type { CliDevice, ExportFormat, OutputContext } from "../types.js"
import { printSuccess } from "../utils.js"

export async function promptAndDownloadSessionData(
  device: CliDevice,
  ctx: OutputContext,
  format?: ExportFormat,
): Promise<void> {
  if (typeof device.download !== "function" || ctx.json) return
  setTranslationLanguage(ctx.language)

  const raw = await input({
    message: t("menu.download-session-data-prompt"),
    default: "n",
  })

  if (!/^y(es)?$/i.test(raw?.trim() ?? "")) return

  const selectedFormat =
    format ??
    (await select({
      message: t("menu.export-format"),
      choices: [
        { name: "CSV", value: "csv" as const },
        { name: "JSON", value: "json" as const },
        { name: "XML", value: "xml" as const },
      ],
    }))

  console.log(pc.cyan(`\n${t("menu.exporting-format", { format: selectedFormat.toUpperCase() })}\n`))
  const filePath = await device.download(selectedFormat)
  printSuccess(
    typeof filePath === "string"
      ? t("menu.data-exported-to", { path: filePath })
      : t("menu.data-exported-as", { format: selectedFormat.toUpperCase() }),
  )
}
