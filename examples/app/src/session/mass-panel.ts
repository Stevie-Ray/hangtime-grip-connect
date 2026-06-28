import type { ForceMeasurement } from "@hangtime/grip-connect"

const deviceMassData: Record<string, ForceMeasurement> = {}

interface MassPanelMetric {
  id?: string
  label: string
  valueText: string
}

function renderMetricRow({ id, label, valueText }: MassPanelMetric): HTMLDivElement {
  const row = document.createElement("div")
  if (id) row.dataset["metricId"] = id
  const labelElement = document.createElement("label")
  labelElement.textContent = label
  const strongElement = document.createElement("strong")
  strongElement.textContent = valueText
  row.appendChild(labelElement)
  row.appendChild(strongElement)
  return row
}

export function addMassHTML(
  id: string | undefined,
  data: ForceMeasurement,
  massesElement: HTMLElement | null,
  elapsedMs: number,
  options?: { peakOnly?: boolean; extraMetrics?: MassPanelMetric[] },
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

  const rows: MassPanelMetric[] = options?.peakOnly
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

  if (options?.extraMetrics) {
    rows.push(...options.extraMetrics)
  }

  for (const row of rows) {
    deviceDiv.appendChild(renderMetricRow(row))
  }
}

export function setDeviceMetricHTML(
  deviceId: string | undefined,
  metricId: string,
  label: string,
  valueText: string,
): void {
  if (!deviceId) return
  const deviceDiv = document.getElementById(`device-${deviceId}`)
  if (!deviceDiv) return

  const existingRow = Array.from(deviceDiv.querySelectorAll<HTMLElement>("[data-metric-id]")).find(
    (row) => row.dataset["metricId"] === metricId,
  )
  const nextRow = renderMetricRow({ id: metricId, label, valueText })

  if (existingRow) {
    existingRow.replaceWith(nextRow)
  } else {
    deviceDiv.appendChild(nextRow)
  }
}
