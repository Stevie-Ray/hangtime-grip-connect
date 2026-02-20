import input from "@inquirer/input"
import select from "@inquirer/select"
import pc from "picocolors"
import type { CliDevice, OutputContext, RunOptions } from "../../types.js"
import { runGuidedTareCalibration } from "../../services/session.js"

export interface StreamActionStartOptions {
  onConfigureOptions?: () => Promise<void>
  getOptionsLabel?: () => string
}

export async function promptStreamActionStart(
  ctx: OutputContext | undefined,
  options?: StreamActionStartOptions,
): Promise<boolean> {
  if (ctx?.json) return true
  while (true) {
    const sessionAction = await select({
      message: "Pick an option:",
      choices: [
        { name: "Start Session", value: "start" as const },
        ...(options?.onConfigureOptions
          ? [{ name: options.getOptionsLabel?.() ?? "Options", value: "options" as const }]
          : []),
        { name: "Go Back", value: "return" as const },
      ],
    })

    if (sessionAction === "start") return true
    if (sessionAction === "return") return false
    await options?.onConfigureOptions?.()
  }
}

export async function ensureTaredForStreamAction(device: CliDevice, options: RunOptions): Promise<void> {
  const sessionState = options.sessionState
  if (!sessionState || sessionState.isTared) return
  if (typeof device.tare !== "function") return

  const outCtx = options.ctx ?? { json: false, unit: "kg" as const }
  if (!outCtx.json) {
    console.log(pc.dim("\nTare required. Running tare first..."))
  }
  await runGuidedTareCalibration(device, 1000, outCtx)
  sessionState.isTared = true
}

export async function runPlaceholderSession(
  title: string,
  body: string,
  _device: CliDevice,
  options: RunOptions,
  startOptions?: StreamActionStartOptions,
  renderOptionSummary?: () => string[],
): Promise<void> {
  if (options.ctx?.json) return

  console.log(pc.cyan(`\n${title}\n`) + pc.dim("─".repeat(60) + "\n") + body)
  const shouldStart = await promptStreamActionStart(options.ctx, startOptions)
  if (!shouldStart) return
  const summary = renderOptionSummary?.() ?? []
  if (summary.length > 0) {
    console.log(pc.dim("\nSelected options:"))
    for (const line of summary) {
      console.log(pc.dim(`- ${line}`))
    }
  }
  console.log(pc.dim("\nThis test is not implemented yet.\n"))
}

export async function promptIntegerSecondsOption(
  label: string,
  currentSeconds: number,
  minimumSeconds = 0,
): Promise<number> {
  const raw = await input({
    message: `${label} (seconds):`,
    default: currentSeconds.toString(),
  })
  const next = Math.trunc(Number(raw.trim()))
  if (!Number.isFinite(next)) return currentSeconds
  return Math.max(minimumSeconds, next)
}
