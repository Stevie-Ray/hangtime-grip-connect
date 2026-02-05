/**
 * Device definition for the SmartBoard Pro.
 */

import { SmartBoardPro } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"

const smartboardPro: DeviceDefinition = {
  name: "SmartBoard Pro",
  class: SmartBoardPro as unknown as new () => CliDevice,
  actions: [],
}

export default smartboardPro
