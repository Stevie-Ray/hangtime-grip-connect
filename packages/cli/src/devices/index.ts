/**
 * Device registry -- single source of truth for all supported devices.
 *
 * Each entry maps a lowercase key to a {@link DeviceDefinition} that
 * contains the human-readable name, runtime constructor, and
 * device-specific actions.
 */

import type { DeviceDefinition } from "../types.js"

import climbro from "./climbro.js"
import entralpi from "./entralpi.js"
import forceboard from "./forceboard.js"
import motherboard from "./motherboard.js"
import mysmartboard from "./mysmartboard.js"
import pb700bt from "./pb-700bt.js"
import progressor from "./progressor.js"
import smartboardPro from "./smartboard-pro.js"
import whc06 from "./wh-c06.js"

/** Map of device keys to their definitions. */
export const devices: Record<string, DeviceDefinition> = {
  climbro,
  entralpi,
  forceboard,
  motherboard,
  mysmartboard,
  "pb-700bt": pb700bt,
  progressor,
  "smartboard-pro": smartboardPro,
  "wh-c06": whc06,
}
