import pc from "picocolors"
import { INFO_METHODS } from "../info-methods.js"
import { outputJson, printHeader, printResult } from "../utils.js"
import type { CliDevice, OutputContext } from "../types.js"

export type DeviceInfoRecord = Record<string, string | undefined>

export async function collectDeviceInfo(device: CliDevice): Promise<DeviceInfoRecord> {
  const info: DeviceInfoRecord = {}
  const raw = device as unknown as Record<string, unknown>

  for (const entry of INFO_METHODS) {
    const fn = raw[entry.key]
    if (typeof fn !== "function") continue
    try {
      info[entry.key] = (await (fn as () => Promise<string | undefined>)()) ?? undefined
    } catch {
      info[entry.key] = undefined
    }
  }

  return info
}

export function hasReadableDeviceInfo(device: CliDevice): boolean {
  const raw = device as unknown as Record<string, unknown>
  return INFO_METHODS.some((entry) => typeof raw[entry.key] === "function")
}

export function renderDeviceInfo(name: string, info: DeviceInfoRecord, ctx: OutputContext): void {
  if (ctx.json) {
    outputJson(info)
    return
  }

  printHeader(`${name} System Info`)
  for (const entry of INFO_METHODS) {
    if (entry.key in info) {
      printResult(entry.label, info[entry.key])
    }
  }
  console.log(pc.dim("─".repeat(40)))
}
