import select from "@inquirer/select"
import pc from "picocolors"
import { savePreferences } from "../../services/preferences.js"
import type { Action, CliDevice, ForceUnit, RunOptions } from "../../types.js"
import { setTranslationLanguage, t } from "../interactive/translations.js"

export function buildUnitSettingsAction(currentUnit: ForceUnit): Action {
  return {
    actionId: "settings-unit",
    name: `Unit (${currentUnit})`,
    description: "Set stream output to kilogram, pound, or newton",
    run: async (_device: CliDevice, options: RunOptions) => {
      const language = options.ctx?.language ?? "en"
      setTranslationLanguage(language)
      const unit = await select({
        message: `${t("menu.unit")}:`,
        choices: [
          { name: t("menu.kilogram"), value: "kg" as const },
          { name: t("menu.pound"), value: "lbs" as const },
          { name: t("menu.newton"), value: "n" as const },
        ],
      })
      if (options.ctx) options.ctx.unit = unit
      await savePreferences({ unit })
      if (!options.ctx?.json) console.log(pc.dim(`${t("menu.unit")}: ${unit}`))
    },
  }
}
