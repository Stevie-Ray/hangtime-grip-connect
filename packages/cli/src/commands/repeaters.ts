import type { Command } from "commander"
import { runRepeatersAction } from "../menus/stream-actions/repeaters.js"
import { parseCountdownSeconds } from "../parsers.js"
import { connectAndRun, createDevice, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

interface RepeatersCliOptions {
  sets?: string
  reps?: string
  work?: string
  rest?: string
  pause?: string
  countdown?: string
  leftRight?: boolean
  startSide?: "left" | "right"
  pauseBetweenSides?: string
  plotTargetLevels?: boolean
  leftMvcKg?: string
  rightMvcKg?: string
  targetMinPercent?: string
  targetMaxPercent?: string
}

export function registerRepeaters(program: Command): void {
  program
    .command("repeaters [device]")
    .description("Run Repeaters test (sets/reps with work-rest timing)")
    .option("--sets <number>", "Number of sets", "3")
    .option("--reps <number>", "Number of reps per set", "12")
    .option("--work <time>", "Work duration per rep (mm:ss or seconds)", "10")
    .option("--rest <time>", "Rest duration between reps (mm:ss or seconds)", "6")
    .option("--pause <time>", "Pause duration between sets (mm:ss or seconds)", "08:00")
    .option("--countdown <time>", "Countdown before capture starts (mm:ss or seconds)", "3")
    .option("--left-right", "Enable Left/Right mode")
    .option("--start-side <left|right>", "Start side for Left/Right mode", "left")
    .option("--pause-between-sides <time>", "Pause between sides (mm:ss or seconds)", "10")
    .option("--plot-target-levels", "Enable target levels plotting")
    .option("--left-mvc-kg <value>", "Left MVC in kg", "0")
    .option("--right-mvc-kg <value>", "Right MVC in kg", "0")
    .option("--target-min-percent <value>", "Target levels minimum (% of MVC)", "40")
    .option("--target-max-percent <value>", "Target levels maximum (% of MVC)", "80")
    .action(async (deviceKey: string | undefined, options: RepeatersCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      const sets = Number.isFinite(Number(options.sets)) ? Math.max(1, Math.trunc(Number(options.sets))) : 3
      const repsPerSet = Number.isFinite(Number(options.reps)) ? Math.max(1, Math.trunc(Number(options.reps))) : 12
      const workSeconds = parseCountdownSeconds(options.work) ?? 10
      const restSeconds = parseCountdownSeconds(options.rest) ?? 6
      const pauseSeconds = parseCountdownSeconds(options.pause) ?? 8 * 60
      const countdownSeconds = parseCountdownSeconds(options.countdown) ?? 3
      const startSide = options.startSide === "right" ? "right" : "left"
      const pauseBetweenSidesSeconds = parseCountdownSeconds(options.pauseBetweenSides) ?? 10
      const leftMvcKg = Number.isFinite(Number(options.leftMvcKg)) ? Math.max(0, Number(options.leftMvcKg)) : 0
      const rightMvcKg = Number.isFinite(Number(options.rightMvcKg)) ? Math.max(0, Number(options.rightMvcKg)) : 0
      const rawMin = Number.isFinite(Number(options.targetMinPercent)) ? Number(options.targetMinPercent) : 40
      const rawMax = Number.isFinite(Number(options.targetMaxPercent)) ? Number(options.targetMaxPercent) : 80
      const targetZoneMinPercent = Math.max(0, Math.min(100, Math.min(rawMin, rawMax)))
      const targetZoneMaxPercent = Math.max(0, Math.min(100, Math.max(rawMin, rawMax)))

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
                repsPerSet,
                workSeconds,
                restSeconds,
                pauseSeconds,
                countdownSeconds,
                leftRightMode: Boolean(options.leftRight),
                startSide,
                pauseBetweenSidesSeconds,
                plotTargetZone: Boolean(options.plotTargetLevels),
                leftMvcKg,
                rightMvcKg,
                targetZoneMinPercent,
                targetZoneMaxPercent,
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
