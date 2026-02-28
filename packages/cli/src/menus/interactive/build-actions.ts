import select from "@inquirer/select"
import { devices } from "../../devices/index.js"
import {
  fetchTrainingPrograms,
  hasTrainingProgramsEnvFile,
  type TrainingProgramRecord,
} from "../../services/training-programs.js"
import { isDynamometerDeviceKey, isDynamometerOnlyActionId } from "../../devices/capabilities.js"
import { buildSettingsAction } from "../settings/index.js"
import { buildStreamActionsList } from "../stream-actions/index.js"
import { runRepeatersAction } from "../stream-actions/repeaters.js"
import type { Action, CliDevice, OutputContext, RepeatersSessionOptions, RunOptions } from "../../types.js"
import { printSuccess } from "../../utils.js"
import { localizeInteractiveActions, setTranslationLanguage, t } from "./translations.js"

/**
 * Build interactive actions for a selected device.
 * Shared actions come first, then device-specific actions, then Disconnect.
 */
export function buildInteractiveActions(deviceKey: string, ctx?: OutputContext): Action[] {
  const key = deviceKey.toLowerCase()
  const definition = devices[key]
  if (!definition) return []

  const device = new definition.class() as unknown as CliDevice
  const sharedActions: Action[] = []
  const isDynamometer = isDynamometerDeviceKey(key)

  if (typeof device.stream === "function") {
    const streamActions = buildStreamActionsList().map((action) => {
      if (!isDynamometerOnlyActionId(action.actionId) || isDynamometer) return action
      return {
        ...action,
        disabled: true,
      }
    })
    sharedActions.push(...streamActions)
  }

  const summarizeText = (input: string | undefined, fallback: string): string => {
    if (!input) return fallback
    const normalized = input.replace(/\s+/g, " ").trim()
    if (normalized.length <= 80) return normalized
    return `${normalized.slice(0, 77)}...`
  }

  const normalizeText = (input: string | undefined, fallback: string): string => {
    if (!input) return fallback
    const normalized = input.replace(/\s+/g, " ").trim()
    return normalized || fallback
  }

  const toDateLabel = (program: TrainingProgramRecord): string => {
    const value = typeof program.date === "number" ? program.date : undefined
    if (!value) return t("menu.unknown")
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return t("menu.unknown")
    return date.toLocaleString()
  }

  const toTagsLabel = (program: TrainingProgramRecord): string => {
    if (!Array.isArray(program.tags)) return t("menu.none")
    const tags = program.tags.filter((tag): tag is string => typeof tag === "string" && tag.trim().length > 0)
    return tags.length > 0 ? tags.join(", ") : t("menu.none")
  }

  const pickProgramId = (program: TrainingProgramRecord, index: number): string =>
    String(program.objectID ?? program.id ?? `${index}`)
  const hasEnvFile = hasTrainingProgramsEnvFile()

  const parseRepeatersPreset = (preset: unknown): RepeatersSessionOptions | undefined => {
    if (typeof preset !== "object" || preset === null) return undefined
    const raw = preset as Record<string, unknown>

    const parseIntMin = (value: unknown, min: number, fallback: number): number => {
      const n = typeof value === "number" ? value : Number(value)
      if (!Number.isFinite(n)) return fallback
      return Math.max(min, Math.trunc(n))
    }
    const parseNumberMin = (value: unknown, min: number, fallback: number): number => {
      const n = typeof value === "number" ? value : Number(value)
      if (!Number.isFinite(n)) return fallback
      return Math.max(min, n)
    }
    const parsePercent = (value: unknown, fallback: number): number => {
      const n = typeof value === "number" ? value : Number(value)
      if (!Number.isFinite(n)) return fallback
      return Math.max(0, Math.min(100, n))
    }

    const rawRestLevel = parsePercent(raw["restLevel"], 40)
    const rawWorkLevel = parsePercent(raw["workLevel"], 80)
    const restLevel = Math.min(rawRestLevel, rawWorkLevel)
    const workLevel = Math.max(rawRestLevel, rawWorkLevel)

    return {
      sets: parseIntMin(raw["sets"], 1, 3),
      reps: parseIntMin(raw["reps"], 1, 12),
      repDur: parseIntMin(raw["repDur"], 1, 10),
      repPauseDur: parseIntMin(raw["repPauseDur"], 0, 6),
      setPauseDur: parseIntMin(raw["setPauseDur"], 0, 8 * 60),
      countDownTime: parseIntMin(raw["countDownTime"], 0, 3),
      mode: raw["mode"] === "bilateral" ? "bilateral" : "single",
      initialSide: raw["initialSide"] === "side.right" ? "side.right" : "side.left",
      pauseBetweenSides: parseIntMin(raw["pauseBetweenSides"], 0, 10),
      levelsEnabled: Boolean(raw["levelsEnabled"]),
      leftMvc: parseNumberMin(raw["leftMvc"], 0, 0),
      rightMvc: parseNumberMin(raw["rightMvc"], 0, 0),
      restLevel,
      workLevel,
    }
  }

  const trainingProgramsAction: Action = {
    actionId: "training-programs",
    name: "Training Programs",
    description: "Get inspired by other users.",
    disabled: !hasEnvFile,
    run: async (currentDevice: CliDevice, options: RunOptions) => {
      setTranslationLanguage(options.ctx?.language ?? "en")
      try {
        const programs = await fetchTrainingPrograms()
        if (programs.length === 0) {
          if (options.ctx?.json) {
            console.log(JSON.stringify({ trainingPrograms: [] }))
          } else {
            console.log(`\n${t("menu.no-training-programs-found")}\n`)
          }
          return
        }

        while (true) {
          const choices = [
            ...programs.map((program, index) => {
              const title = summarizeText(program.name ?? program.title, t("menu.untitled"))
              const description = summarizeText(program.description, t("menu.no-description"))
              const likes = typeof program.likes === "number" ? program.likes : 0
              return {
                name: `${title} - ${description} (${likes} ${t("menu.likes").toLowerCase()})`,
                value: pickProgramId(program, index),
              }
            }),
            { name: t("menu.back"), value: "__back__" },
          ]

          const selectedId = await select<string>({
            message: t("actions.training-programs.name"),
            choices,
          })

          if (selectedId === "__back__") return
          const selected = programs.find((program, index) => pickProgramId(program, index) === selectedId)
          if (!selected) continue

          if (options.ctx?.json) {
            console.log(JSON.stringify(selected))
            return
          }

          const dateLabel = toDateLabel(selected)
          const name = normalizeText(selected.name ?? selected.title, t("menu.untitled"))
          const description = normalizeText(selected.description, t("menu.no-description"))
          const likesLabel = typeof selected.likes === "number" ? String(selected.likes) : "0"
          const tagsLabel = toTagsLabel(selected)

          console.log(`\n${t("menu.training-program")}`)
          console.log("────────────────────────────────────────")
          console.log(`${t("menu.date")}: ${dateLabel}`)
          console.log(`${t("menu.name")}: ${name}`)
          console.log(`${t("menu.description")}: ${description}`)
          console.log(`${t("menu.likes")}: ${likesLabel}`)
          console.log(`${t("menu.tags")}: ${tagsLabel}\n`)

          const detailAction = await select<"load" | "return">({
            message: t("menu.choose-option"),
            choices: [
              { name: t("menu.load-preset"), value: "load" },
              { name: t("menu.go-back"), value: "return" },
            ],
          })

          if (detailAction === "return") {
            continue
          }

          const repeatersPreset = selected["repeatersPreset"]
          if (repeatersPreset === undefined) {
            console.log(`\n${t("menu.no-repeaters-preset-found")}\n`)
            continue
          }

          const repeatersSession = parseRepeatersPreset(repeatersPreset)
          if (!repeatersSession) {
            console.log(`\n${t("menu.invalid-repeaters-preset-payload")}\n`)
            continue
          }

          await runRepeatersAction(currentDevice, {
            ...options,
            session: {
              ...(options.session ?? {}),
              repeaters: repeatersSession,
            },
          })
          return
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        console.error(`${t("menu.failed-to-load-training-programs")}: ${message}`)
      }
    },
  }

  sharedActions.push(trainingProgramsAction)

  const settingsAction = buildSettingsAction(device, definition, ctx)
  if (settingsAction) {
    sharedActions.push(settingsAction)
  }

  const disconnectAction: Action = {
    actionId: "disconnect",
    name: "Disconnect",
    description: "Disconnect from current device and pick another",
    run: async (currentDevice: CliDevice, options: RunOptions) => {
      if (key === "progressor") {
        const sleepFn = (currentDevice as { sleep?: () => Promise<void> }).sleep
        if (typeof sleepFn === "function") {
          await sleepFn()
        }
      }
      if (!options.ctx?.json) {
        printSuccess("Disconnected. You can pick another device.")
      }
    },
  }

  const allActions = [...sharedActions, ...definition.actions, disconnectAction]
  return localizeInteractiveActions(allActions, ctx?.language ?? "en")
}
