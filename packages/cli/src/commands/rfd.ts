import type { Command } from "commander"
import { runRfdAction } from "../menus/stream-actions/rfd.js"
import { parseDurationSeconds } from "../parsers.js"
import { connectAndRun, createDevice, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

interface RfdCliOptions {
  duration?: string
  countdown?: string
  threshold?: string
  leftRight?: boolean
}

export function registerRfd(program: Command): void {
  program
    .command("rfd [device]")
    .description("Run Rate of Force Development test")
    .option("-d, --duration <seconds>", "Capture duration in seconds", "5")
    .option("--countdown <seconds>", "Countdown before capture starts", "3")
    .option("--threshold <value>", "Onset threshold in current force unit", "0.5")
    .option("--left-right", "Enable Left/Right mode")
    .action(async (deviceKey: string | undefined, options: RfdCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)
      const durationMs = parseDurationSeconds(options.duration) ?? 5000
      const countdownSeconds = Number.isFinite(Number(options.countdown)) ? Math.max(0, Number(options.countdown)) : 3
      const threshold = Number.isFinite(Number(options.threshold)) ? Number(options.threshold) : 0.5

      if (!ctx.json) {
        printHeader(`RFD – ${name}`)
      }

      await connectAndRun(
        device,
        name,
        async (d) =>
          runRfdAction(d, {
            ctx,
            nonInteractive: true,
            stream: { durationMs },
            session: {
              rfd: {
                countdownSeconds,
                threshold,
                leftRightMode: Boolean(options.leftRight),
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
