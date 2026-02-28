import type { Command } from "commander"
import { isDynamometerDeviceKey, isDynamometerOnlyActionId } from "../devices/capabilities.js"
import type { Action, RunOptions } from "../types.js"
import { parseDurationSeconds } from "../parsers.js"
import { buildInteractiveActions } from "../menus/interactive/build-actions.js"
import {
  connectAndRun,
  createDevice,
  outputJson,
  printHeader,
  resolveContext,
  resolveDeviceKey,
  fail,
} from "../utils.js"

interface ActionCliOptions {
  duration?: string
  setCalibrationCurve?: string
  saveCalibration?: boolean
  ledColor?: "green" | "red" | "orange" | "off"
  thresholdLbs?: string
}

interface ResolvedAction {
  action: Action
  segments: string[]
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

function actionSegment(action: Action): string {
  const cleaned = action.name.replace(/\s*\([^)]*\)/g, "").trim()
  return slugify(cleaned)
}

function parsePath(path: string): string[] {
  return path
    .split("/")
    .map((segment) => slugify(segment))
    .filter((segment) => segment.length > 0)
}

function findActionByPath(actions: Action[], path: string): ResolvedAction | undefined {
  const segments = parsePath(path)
  if (segments.length === 0) return undefined

  let current = actions
  let matched: Action | undefined

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i]
    const next = current.find((action) => actionSegment(action) === segment)
    if (!next) return undefined

    matched = next
    if (i < segments.length - 1) {
      if (!next.subactions || next.subactions.length === 0) return undefined
      current = next.subactions
    }
  }

  return matched ? { action: matched, segments } : undefined
}

function flattenActions(actions: Action[], parentPath = ""): { path: string; description: string }[] {
  const rows: { path: string; description: string }[] = []

  for (const action of actions) {
    if (action.name === "Disconnect" || action.name === "Return") continue
    const segment = actionSegment(action)
    const path = parentPath ? `${parentPath}/${segment}` : segment

    if (action.subactions && action.subactions.length > 0) {
      rows.push(...flattenActions(action.subactions, path))
      continue
    }

    rows.push({ path, description: action.description })
  }

  return rows
}

export function registerAction(program: Command): void {
  program
    .command("action [device] [path]")
    .description("Run any interactive action non-interactively by path, or list action paths")
    .option("-d, --duration <seconds>", "Duration for actions that support a duration")
    .option("--set-calibration-curve <hex>", "Progressor calibration curve (12-byte hex)")
    .option("--save-calibration", "Save calibration after add calibration point")
    .option("--led-color <green|red|orange|off>", "Motherboard LED color")
    .option("--threshold-lbs <value>", "ForceBoard threshold in lbs")
    .action(async (deviceKey: string | undefined, path: string | undefined, options: ActionCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const actions = buildInteractiveActions(key, ctx).filter((action) => action.name !== "Disconnect")

      const available = flattenActions(actions)
      if (!path) {
        if (ctx.json) {
          outputJson({ device: key, actions: available })
          return
        }

        printHeader(`Actions for ${key}`)
        for (const row of available) {
          console.log(`  ${row.path.padEnd(40)} ${row.description}`)
        }
        console.log("")
        return
      }

      const resolved = findActionByPath(actions, path)
      if (!resolved) {
        const sample = available.slice(0, 10).map((row) => row.path)
        fail(`Unknown action path: ${path}\nAvailable examples: ${sample.join(", ")}`)
      }
      if (resolved.action.subactions && resolved.action.subactions.length > 0) {
        fail(`Action path must target a runnable leaf action: ${path}`)
      }
      if (resolved.action.disabled) {
        fail(`Action path is disabled for device '${key}': ${path}`)
      }
      if (isDynamometerOnlyActionId(resolved.action.actionId) && !isDynamometerDeviceKey(key)) {
        fail(`Action '${path}' is only available for dynamometers.`)
      }

      const durationMs = options.duration ? parseDurationSeconds(options.duration) : undefined
      const thresholdLbs =
        options.thresholdLbs != null && Number.isFinite(Number(options.thresholdLbs))
          ? Number(options.thresholdLbs)
          : undefined

      const runOptions: RunOptions = {
        ctx,
        nonInteractive: true,
        sessionState: { isTared: false },
        ...(durationMs != null ? { stream: { durationMs } } : {}),
        ...(options.setCalibrationCurve || options.saveCalibration
          ? {
              calibration: {
                ...(options.setCalibrationCurve ? { setCalibrationCurve: options.setCalibrationCurve } : {}),
                ...(options.saveCalibration ? { saveCalibration: true } : {}),
              },
            }
          : {}),
        ...(options.ledColor || thresholdLbs != null
          ? {
              deviceAction: {
                ...(options.ledColor ? { ledColor: options.ledColor } : {}),
                ...(thresholdLbs != null ? { thresholdLbs } : {}),
              },
            }
          : {}),
      }

      const { device, name } = createDevice(key)
      await connectAndRun(device, name, async (d) => resolved.action.run(d, runOptions), ctx, {
        setupDefaultNotify: false,
      })
    })
}
