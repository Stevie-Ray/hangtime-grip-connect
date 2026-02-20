import input from "@inquirer/input"
import type { CliDevice, InteractiveSessionState, OutputContext, RunOptions } from "../../types.js"
import { pickAction } from "../../utils.js"
import { buildInteractiveActions } from "./build-actions.js"

/**
 * Pick action -> run -> repeat until Disconnect or Sleep.
 * Keeps the user in an action menu for the same device so they can run multiple
 * operations (Live Data, Tare, Download, etc.) without reconnecting.
 */
export async function runInteractiveActionLoop(
  device: CliDevice,
  deviceKey: string,
  ctx: OutputContext,
  sessionState: InteractiveSessionState = { isTared: false },
): Promise<void> {
  const actions = buildInteractiveActions(deviceKey, ctx)
  const action = await pickAction(actions)

  if (action.name === "Disconnect") {
    await action.run(device, { ctx, sessionState })
    return
  }

  const opts: RunOptions = { ctx, sessionState }
  if (action.name === "Live Data") {
    const raw = await input({
      message: "Duration in seconds (Optional):",
      default: "",
    })
    const trimmed = raw.trim()
    if (trimmed === "") {
      opts.stream = { ...(opts.stream ?? {}), durationMs: 0 }
    } else {
      const sec = parseFloat(trimmed || "10")
      opts.stream = { ...(opts.stream ?? {}), durationMs: (Number.isNaN(sec) ? 0 : sec) * 1000 }
    }
  }

  await action.run(device, opts)
  if (action.name === "Sleep") return

  return runInteractiveActionLoop(device, deviceKey, ctx, sessionState)
}
