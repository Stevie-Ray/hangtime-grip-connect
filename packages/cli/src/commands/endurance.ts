import type { Command } from "commander"
import { runEnduranceAction } from "../menus/stream-actions/endurance.js"
import { parseCountdownSeconds, parseDurationSeconds } from "../parsers.js"
import { connectAndRun, createDevice, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

interface EnduranceCliOptions {
  duration?: string
  countdown?: string
  leftRight?: boolean
  startSide?: "left" | "right"
  pauseBetweenSides?: string
  plotTargetZone?: boolean
  leftMvcKg?: string
  rightMvcKg?: string
  targetMinPercent?: string
  targetMaxPercent?: string
}

export function registerEndurance(program: Command): void {
  program
    .command("endurance [device]")
    .description("Run time-based Endurance test")
    .option("-d, --duration <time>", "Capture duration (mm:ss or seconds)", "00:30")
    .option("--countdown <time>", "Countdown before capture starts (mm:ss or seconds)", "3")
    .option("--left-right", "Enable Left/Right mode")
    .option("--start-side <left|right>", "Start side for Left/Right mode", "left")
    .option("--pause-between-sides <time>", "Pause between sides (mm:ss or seconds)", "10")
    .option("--plot-target-zone", "Enable target zone plotting")
    .option("--left-mvc-kg <value>", "Left MVC in kg", "0")
    .option("--right-mvc-kg <value>", "Right MVC in kg", "0")
    .option("--target-min-percent <value>", "Target zone minimum (% of MVC)", "40")
    .option("--target-max-percent <value>", "Target zone maximum (% of MVC)", "80")
    .action(async (deviceKey: string | undefined, options: EnduranceCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      const durationMs = parseDurationSeconds(options.duration) ?? 30000
      const countdownSeconds = parseCountdownSeconds(options.countdown) ?? 3
      const pauseBetweenSidesSeconds = parseCountdownSeconds(options.pauseBetweenSides) ?? 10
      const startSide = options.startSide === "right" ? "right" : "left"
      const leftMvcKg = Number.isFinite(Number(options.leftMvcKg)) ? Math.max(0, Number(options.leftMvcKg)) : 0
      const rightMvcKg = Number.isFinite(Number(options.rightMvcKg)) ? Math.max(0, Number(options.rightMvcKg)) : 0
      const rawMin = Number.isFinite(Number(options.targetMinPercent)) ? Number(options.targetMinPercent) : 40
      const rawMax = Number.isFinite(Number(options.targetMaxPercent)) ? Number(options.targetMaxPercent) : 80
      const targetZoneMinPercent = Math.max(0, Math.min(100, Math.min(rawMin, rawMax)))
      const targetZoneMaxPercent = Math.max(0, Math.min(100, Math.max(rawMin, rawMax)))

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
                countdownSeconds,
                leftRightMode: Boolean(options.leftRight),
                startSide,
                pauseBetweenSidesSeconds,
                plotTargetZone: Boolean(options.plotTargetZone),
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
