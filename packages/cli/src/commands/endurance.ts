import type { Command } from "commander"
import { runEnduranceAction } from "../menus/stream-actions/endurance.js"
import { parseCountdownSeconds, parseDurationSeconds } from "../parsers.js"
import { connectAndRun, createDevice, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

interface EnduranceCliOptions {
  duration?: string
  countDownTime?: string
  mode?: "single" | "unilateral" | "left-right" | "bilateral"
  initialSide?: "side.left" | "side.right"
  pauseBetweenSides?: string
  levelsEnabled?: boolean
  leftMvc?: string
  rightMvc?: string
  restLevel?: string
  workLevel?: string
}

export function registerEndurance(program: Command): void {
  program
    .command("endurance [device]")
    .description("Run time-based Endurance test")
    .option("-d, --duration <time>", "Capture duration (mm:ss or seconds)", "00:30")
    .option("--count-down-time <time>", "Countdown before capture starts (mm:ss or seconds)", "3")
    .option("--mode <single|left-right>", "Session mode", "single")
    .option("--initial-side <side.left|side.right>", "Initial side for Left/Right mode", "side.left")
    .option("--pause-between-sides <time>", "Pause between sides (mm:ss or seconds)", "10")
    .option("--levels-enabled", "Enable target zone plotting")
    .option("--left-mvc <value>", "Left MVC in kg", "0")
    .option("--right-mvc <value>", "Right MVC in kg", "0")
    .option("--rest-level <value>", "Target zone minimum (% of MVC)", "40")
    .option("--work-level <value>", "Target zone maximum (% of MVC)", "80")
    .action(async (deviceKey: string | undefined, options: EnduranceCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      const durationMs = parseDurationSeconds(options.duration) ?? 30000
      const countDownTime = parseCountdownSeconds(options.countDownTime) ?? 3
      const pauseBetweenSides = parseCountdownSeconds(options.pauseBetweenSides) ?? 10
      const initialSide = options.initialSide === "side.right" ? "side.right" : "side.left"
      const leftMvc = Number.isFinite(Number(options.leftMvc)) ? Math.max(0, Number(options.leftMvc)) : 0
      const rightMvc = Number.isFinite(Number(options.rightMvc)) ? Math.max(0, Number(options.rightMvc)) : 0
      const rawMin = Number.isFinite(Number(options.restLevel)) ? Number(options.restLevel) : 40
      const rawMax = Number.isFinite(Number(options.workLevel)) ? Number(options.workLevel) : 80
      const restLevel = Math.max(0, Math.min(100, Math.min(rawMin, rawMax)))
      const workLevel = Math.max(0, Math.min(100, Math.max(rawMin, rawMax)))
      const mode = options.mode === "bilateral" || options.mode === "left-right" ? "bilateral" : "unilateral"

      if (!ctx.json) {
        printHeader(`Endurance – ${name}`)
      }

      await connectAndRun(
        device,
        name,
        async (d) =>
          runEnduranceAction(d, {
            ctx,
            nonInteractive: true,
            session: {
              endurance: {
                durationSeconds: Math.max(1, Math.round(durationMs / 1000)),
                countDownTime,
                mode,
                initialSide,
                pauseBetweenSides,
                levelsEnabled: Boolean(options.levelsEnabled),
                leftMvc,
                rightMvc,
                restLevel,
                workLevel,
              },
            },
          }),
        ctx,
        {
          setupDefaultNotify: false,
        },
      )
    })
}
