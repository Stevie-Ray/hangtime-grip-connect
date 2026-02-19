import select from "@inquirer/select"
import pc from "picocolors"
import type { Action, CliDevice, RunOptions } from "../../types.js"
import { outputJson } from "../../utils.js"

export function buildLanguageSettingsAction(): Action {
  return {
    name: "Language (English)",
    description: "CLI display language",
    run: async (_device: CliDevice, options: RunOptions) => {
      const lang = await select({
        message: "Language:",
        choices: [{ name: "English", value: "en" as const }],
      })
      if (options.ctx?.json) {
        outputJson({ language: lang })
      } else {
        console.log(pc.dim(`Language: ${lang === "en" ? "English" : lang}`))
      }
    },
  }
}
