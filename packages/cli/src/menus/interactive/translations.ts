import type { Action, CliLanguage } from "../../types.js"
import { INTERACTIVE_LOCALES } from "./locales/index.js"
import type { LocalizedActionKey, TranslationKey } from "./locales/types.js"

const SUPPORTED_LANGUAGES: CliLanguage[] = ["en", "es", "de", "it", "no", "fr", "nl"]
let currentLanguage: CliLanguage = "en"

function preserveUnitSuffix(localizedName: string, originalName: string): string {
  const suffix = originalName.match(/\(([^)]+)\)\s*$/)?.[0]
  return suffix ? `${localizedName} ${suffix}` : localizedName
}

function lookup(language: CliLanguage, key: TranslationKey): string | undefined {
  const read = (locale: (typeof INTERACTIVE_LOCALES)[CliLanguage]): string | undefined => {
    const parts = key.split(".")
    let cursor: unknown = locale
    for (const part of parts) {
      if (cursor == null || typeof cursor !== "object") return undefined
      cursor = (cursor as Record<string, unknown>)[part]
    }
    return typeof cursor === "string" ? cursor : undefined
  }
  return read(INTERACTIVE_LOCALES[language]) ?? read(INTERACTIVE_LOCALES.en)
}

function interpolate(input: string, params?: Record<string, string | number>): string {
  if (!params) return input
  let out = input
  for (const [k, v] of Object.entries(params)) {
    out = out.replaceAll(`{${k}}`, String(v))
  }
  return out
}

export function setTranslationLanguage(language: CliLanguage): void {
  currentLanguage = language
}

export function t(key: TranslationKey | string, params?: Record<string, string | number>): string
export function t(language: CliLanguage, key: TranslationKey | string, params?: Record<string, string | number>): string
export function t(
  arg1: CliLanguage | TranslationKey | string,
  arg2?: TranslationKey | string | Record<string, string | number>,
  arg3?: Record<string, string | number>,
): string {
  let language: CliLanguage = currentLanguage
  let key: TranslationKey | string
  let params: Record<string, string | number> | undefined

  if (typeof arg1 === "string" && SUPPORTED_LANGUAGES.includes(arg1 as CliLanguage)) {
    language = arg1 as CliLanguage
    key = (arg2 as TranslationKey | string) ?? ""
    params = arg3
  } else {
    key = arg1 as TranslationKey | string
    params = arg2 as Record<string, string | number> | undefined
  }

  const resolved = lookup(language, key as TranslationKey)
  return interpolate(resolved ?? key, params)
}

export function localizeInteractiveActions(actions: Action[], language: CliLanguage): Action[] {
  if (language === "en") return actions

  return actions.map((action) => {
    const key = action.actionId as LocalizedActionKey | undefined
    const localizedName = key ? t(language, `actions.${key}.name`) : undefined
    const localizedDescription = key ? t(language, `actions.${key}.description`) : undefined
    const nextName =
      key && localizedName && (key === "settings-unit" || key === "settings-language")
        ? preserveUnitSuffix(localizedName, action.name)
        : localizedName

    return {
      ...action,
      ...(key ? { name: nextName ?? action.name, description: localizedDescription ?? action.description } : {}),
      ...(action.subactions ? { subactions: localizeInteractiveActions(action.subactions, language) } : {}),
    }
  })
}
