import select from "@inquirer/select"
import pc from "picocolors"
import type { Action, CliDevice, OutputContext, RunOptions } from "../../types.js"
import { runGuidedTareCalibration } from "../../services/session.js"
import { pickAction } from "../../utils.js"

/** Placeholder flow used by tests that are not implemented yet. */
const MODE_SUBACTIONS: Action[] = [
  {
    name: "Start",
    description: "Begin the test",
    run: async () => {
      return
    },
  },
  {
    name: "Return",
    description: "Go back to main menu",
    run: async () => {
      return
    },
  },
]

export async function promptStreamActionStart(ctx: OutputContext | undefined): Promise<boolean> {
  if (ctx?.json) return true
  const sessionAction = await select({
    message: "Next:",
    choices: [
      { name: "Start", value: "start" as const },
      { name: "Return", value: "return" as const },
    ],
  })
  return sessionAction === "start"
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
  device: CliDevice,
  options: RunOptions,
): Promise<void> {
  if (options.ctx?.json) return

  console.log(pc.cyan(`\n${title}\n`) + pc.dim("─".repeat(60) + "\n") + body)
  const sub = await pickAction(MODE_SUBACTIONS, "Next:")
  if (sub.name === "Return") return
  console.log(pc.dim("\nThis test is not implemented yet.\n"))
  await sub.run(device, options)
}
