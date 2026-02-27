import { criticalForceModule } from "./critical-force.js"
import { enduranceModule } from "./endurance.js"
import { liveDataModule } from "./live-data.js"
import { peakForceMvcModule } from "./peak-force-mvc.js"
import { repeatersModule } from "./repeaters.js"
import { rfdModule } from "./rfd.js"
import type { TestId, TestModule } from "./types.js"

const modules: Record<TestId, TestModule<unknown>> = {
  "live-data": liveDataModule,
  "peak-force-mvc": peakForceMvcModule,
  endurance: enduranceModule,
  rfd: rfdModule,
  repeaters: repeatersModule,
  "critical-force": criticalForceModule,
}

export function getTestModule(id: string): TestModule<unknown> | null {
  if (!(id in modules)) return null
  return modules[id as TestId]
}
