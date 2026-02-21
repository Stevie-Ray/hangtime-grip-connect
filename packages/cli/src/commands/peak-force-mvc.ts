import type { Command } from "commander"
import { runPeakForceMvcAction } from "../menus/stream-actions/peak-force-mvc.js"
import { connectAndRun, createDevice, printHeader, resolveContext, resolveDeviceKey } from "../utils.js"

interface PeakForceCliOptions {
  mode?: "single" | "left-right"
  includeTorque?: boolean
  momentArmCm?: string
  includeBodyWeightComparison?: boolean
  bodyWeight?: string
}

export function registerPeakForceMvc(program: Command): void {
  program
    .command("peak-force-mvc [device]")
    .alias("peak-force")
    .alias("mvc")
    .description("Run Peak Force / MVC test")
    .option("--mode <single|left-right>", "Test mode", "single")
    .option("--include-torque", "Include torque calculation")
    .option("--moment-arm-cm <cm>", "Moment arm length in centimeters")
    .option("--include-body-weight-comparison", "Include body weight comparison")
    .option("--body-weight <value>", "Body weight value in your current unit setting")
    .action(async (deviceKey: string | undefined, options: PeakForceCliOptions) => {
      const ctx = resolveContext(program)
      const key = await resolveDeviceKey(deviceKey)
      const { device, name } = createDevice(key)

      const mode = options.mode === "left-right" ? "left-right" : "single"
      const momentArmCm = Number.isFinite(Number(options.momentArmCm)) ? Number(options.momentArmCm) : undefined
      const bodyWeight = Number.isFinite(Number(options.bodyWeight)) ? Number(options.bodyWeight) : undefined

      if (!ctx.json) {
        printHeader(`Peak Force / MVC – ${name}`)
      }

      await connectAndRun(
        device,
        name,
        async (d) =>
          runPeakForceMvcAction(d, {
            ctx,
            nonInteractive: true,
            session: {
              peakForce: {
                mode,
                includeTorque: Boolean(options.includeTorque),
                ...(momentArmCm != null ? { momentArmCm } : {}),
                includeBodyWeightComparison: Boolean(options.includeBodyWeightComparison),
                ...(bodyWeight != null ? { bodyWeight } : {}),
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
