/**
 * Device definition for the WH-C06 scale.
 */

import { WHC06 } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"

const whc06: DeviceDefinition = {
  name: "WH-C06",
  class: WHC06 as unknown as new () => CliDevice,
  actions: [],
}

export default whc06
