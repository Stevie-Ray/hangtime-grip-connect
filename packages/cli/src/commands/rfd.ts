import type { Command } from "commander"
import { runRfdAction } from "../menus/stream-actions/rfd.js"
import { parseCountdownSeconds, parseDurationSeconds } from "../parsers.js"
import { connectAndRun, createDevice, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

interface RfdCliOptions {
  duration?: string
  countDownTime?: string
  threshold?: string
  mode?: "single" | "bilateral"
}

export function registerRfd(program: Command): void {
  program
    .command("rfd [device]")
    .description("Run Rate of Force Development test")
    .option("-d, --duration <seconds>", "Capture duration in seconds", "5")
    .option("--count-down-time <time>", "Countdown before capture starts (mm:ss or seconds)", "3")
    .option("--threshold <value>", "Onset threshold in current force unit", "0.5")
    .option("--mode <single|bilateral>", "Session mode", "single")
    .action(async (deviceKey: string | undefined, options: RfdCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)
      const durationMs = parseDurationSeconds(options.duration) ?? 5000
      const countDownTime = parseCountdownSeconds(options.countDownTime) ?? 3
      const threshold = Number.isFinite(Number(options.threshold)) ? Number(options.threshold) : 0.5
      const mode = options.mode === "bilateral" ? "bilateral" : "single"

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
                countDownTime,
                threshold,
                mode,
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
