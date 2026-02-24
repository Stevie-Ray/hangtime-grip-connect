import select from "@inquirer/select"
import pc from "picocolors"
import { savePreferences } from "../../services/preferences.js"
import type { Action, CliDevice, CliLanguage, RunOptions } from "../../types.js"
import { outputJson } from "../../utils.js"
import { setTranslationLanguage, t } from "../interactive/translations.js"

const LANGUAGE_CHOICES = [
  { name: "English", value: "en" },
  { name: "Espanol", value: "es" },
  { name: "Deutsch", value: "de" },
  { name: "Italiano", value: "it" },
  { name: "Norsk", value: "no" },
  { name: "Francais", value: "fr" },
  { name: "Nederlands", value: "nl" },
] as const

type LanguageCode = (typeof LANGUAGE_CHOICES)[number]["value"]

function languageLabel(code: LanguageCode): string {
  const found = LANGUAGE_CHOICES.find((choice) => choice.value === code)
  return found?.name ?? code
}

export function buildLanguageSettingsAction(currentLanguage: CliLanguage): Action {
  return {
    actionId: "settings-language",
    name: `Language (${languageLabel(currentLanguage)})`,
    description: "CLI display language",
    run: async (_device: CliDevice, options: RunOptions) => {
      const language = options.ctx?.language ?? "en"
      setTranslationLanguage(language)
      const lang = await select<LanguageCode>({
        message: `${t("menu.language")}:`,
        choices: LANGUAGE_CHOICES.map((choice) => ({ name: choice.name, value: choice.value })),
      })
      if (options.ctx) {
        options.ctx.language = lang
      }
      await savePreferences({ language: lang })
      if (options.ctx?.json) {
        outputJson({ language: lang })
      } else {
        setTranslationLanguage(lang)
        console.log(pc.dim(`${t("menu.language")}: ${languageLabel(lang)}`))
      }
    },
  }
}
