/**
 * Device definition for the mySmartBoard.
 */

import { mySmartBoard } from "@hangtime/grip-connect-runtime"
import type { DeviceDefinition, CliDevice } from "../types.js"

const mysmartboard: DeviceDefinition = {
  name: "mySmartBoard",
  class: mySmartBoard as unknown as new () => CliDevice,
  actions: [],
}

export default mysmartboard
