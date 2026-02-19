import type { Action } from "../../types.js"
import { buildCriticalForceAction } from "./critical-force.js"
import { buildEnduranceAction } from "./endurance.js"
import { buildLiveDataAction } from "./live-data.js"
import { buildPeakForceMvcAction } from "./peak-force-mvc.js"
import { buildRepeatersAction } from "./repeaters.js"
import { buildRfdAction } from "./rfd.js"

export function buildStreamActionsList(): Action[] {
  return [
    buildLiveDataAction(),
    buildPeakForceMvcAction(),
    buildEnduranceAction(),
    buildRfdAction(),
    buildRepeatersAction(),
    buildCriticalForceAction(),
  ]
}
