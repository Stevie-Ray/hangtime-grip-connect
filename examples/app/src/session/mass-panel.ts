import type { ForceMeasurement } from "@hangtime/grip-connect"

const deviceMassData: Record<string, ForceMeasurement> = {}

export function addMassHTML(
  id: string | undefined,
  data: ForceMeasurement,
  massesElement: HTMLElement | null,
  elapsedMs: number,
  options?: { peakOnly?: boolean },
): void {
  if (!id || !massesElement) return
  deviceMassData[id] = data

  let deviceDiv = document.getElementById(`device-${id}`)
  if (!deviceDiv) {
    deviceDiv = document.createElement("div")
    deviceDiv.id = `device-${id}`
    deviceDiv.className = "device-mass"
    massesElement.appendChild(deviceDiv)
  } else {
    deviceDiv.innerHTML = ""
  }

  const rows: { label: string; valueText: string }[] = options?.peakOnly
    ? [{ label: "Max", valueText: `${data.peak.toFixed(2)} ${data.unit}` }]
    : [
        { label: "Current", valueText: `${data.current.toFixed(2)} ${data.unit}` },
        { label: "Max", valueText: `${data.peak.toFixed(2)} ${data.unit}` },
        { label: "Average", valueText: `${data.mean.toFixed(2)} ${data.unit}` },
        { label: "Time", valueText: `${(elapsedMs / 1000).toFixed(0)} s` },
      ]

  if (!options?.peakOnly && data.distribution) {
    if (data.distribution.left)
      rows.push({ label: "Left", valueText: `${data.distribution.left.current.toFixed(2)} ${data.unit}` })
    if (data.distribution.center)
      rows.push({ label: "Center", valueText: `${data.distribution.center.current.toFixed(2)} ${data.unit}` })
    if (data.distribution.right)
      rows.push({ label: "Right", valueText: `${data.distribution.right.current.toFixed(2)} ${data.unit}` })
  }

  for (const { label, valueText } of rows) {
    const row = document.createElement("div")
    const labelElement = document.createElement("label")
    labelElement.textContent = label
    const strongElement = document.createElement("strong")
    strongElement.textContent = valueText
    row.appendChild(labelElement)
    row.appendChild(strongElement)
    deviceDiv.appendChild(row)
  }
}
