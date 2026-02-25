import type { Command } from "commander"
import { runRepeatersAction } from "../menus/stream-actions/repeaters.js"
import { parseCountdownSeconds } from "../parsers.js"
import { connectAndRun, createDevice, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

interface RepeatersCliOptions {
  sets?: string
  reps?: string
  repDur?: string
  repPauseDur?: string
  setPauseDur?: string
  countDownTime?: string
  mode?: "single" | "bilateral"
  initialSide?: "side.left" | "side.right"
  pauseBetweenSides?: string
  levelsEnabled?: boolean
  leftMvc?: string
  rightMvc?: string
  restLevel?: string
  workLevel?: string
}

export function registerRepeaters(program: Command): void {
  program
    .command("repeaters [device]")
    .description("Run Repeaters test (sets/reps with work-rest timing)")
    .option("--sets <number>", "Number of sets", "3")
    .option("--reps <number>", "Number of reps per set", "12")
    .option("--rep-dur <time>", "Work duration per rep (mm:ss or seconds)", "10")
    .option("--rep-pause-dur <time>", "Rest duration between reps (mm:ss or seconds)", "6")
    .option("--set-pause-dur <time>", "Pause duration between sets (mm:ss or seconds)", "08:00")
    .option("--count-down-time <time>", "Countdown before capture starts (mm:ss or seconds)", "3")
    .option("--mode <single|bilateral>", "Session mode", "single")
    .option("--initial-side <side.left|side.right>", "Initial side for Left/Right mode", "side.left")
    .option("--pause-between-sides <time>", "Pause between sides (mm:ss or seconds)", "10")
    .option("--levels-enabled", "Enable target levels plotting")
    .option("--left-mvc <value>", "Left MVC in kg", "0")
    .option("--right-mvc <value>", "Right MVC in kg", "0")
    .option("--rest-level <value>", "Target levels minimum (% of MVC)", "40")
    .option("--work-level <value>", "Target levels maximum (% of MVC)", "80")
    .action(async (deviceKey: string | undefined, options: RepeatersCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      const sets = Number.isFinite(Number(options.sets)) ? Math.max(1, Math.trunc(Number(options.sets))) : 3
      const reps = Number.isFinite(Number(options.reps)) ? Math.max(1, Math.trunc(Number(options.reps))) : 12
      const repDur = parseCountdownSeconds(options.repDur) ?? 10
      const repPauseDur = parseCountdownSeconds(options.repPauseDur) ?? 6
      const setPauseDur = parseCountdownSeconds(options.setPauseDur) ?? 8 * 60
      const countDownTime = parseCountdownSeconds(options.countDownTime) ?? 3
      const initialSide = options.initialSide === "side.right" ? "side.right" : "side.left"
      const pauseBetweenSides = parseCountdownSeconds(options.pauseBetweenSides) ?? 10
      const leftMvc = Number.isFinite(Number(options.leftMvc)) ? Math.max(0, Number(options.leftMvc)) : 0
      const rightMvc = Number.isFinite(Number(options.rightMvc)) ? Math.max(0, Number(options.rightMvc)) : 0
      const rawMin = Number.isFinite(Number(options.restLevel)) ? Number(options.restLevel) : 40
      const rawMax = Number.isFinite(Number(options.workLevel)) ? Number(options.workLevel) : 80
      const restLevel = Math.max(0, Math.min(100, Math.min(rawMin, rawMax)))
      const workLevel = Math.max(0, Math.min(100, Math.max(rawMin, rawMax)))
      const mode = options.mode === "bilateral" ? "bilateral" : "single"

      if (!ctx.json) {
        printHeader(`Repeaters – ${name}`)
      }

      await connectAndRun(
        device,
        name,
        async (d) =>
          runRepeatersAction(d, {
            ctx,
            nonInteractive: true,
            session: {
              repeaters: {
                sets,
                reps,
                repDur,
                repPauseDur,
                setPauseDur,
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
