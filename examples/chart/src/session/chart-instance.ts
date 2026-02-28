import { Chart } from "chart.js/auto"

export function createSessionChart(chartElement: HTMLCanvasElement): Chart {
  return new Chart(chartElement, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        { label: "Current", data: [], borderWidth: 2, borderColor: "#36a2eb", backgroundColor: "#36a2eb" },
        { label: "Mean", data: [], borderWidth: 2, borderColor: "#ff9f40", backgroundColor: "#ff9f40" },
        { label: "Peak", data: [], borderWidth: 2, borderColor: "#ff6384", backgroundColor: "#ff6384" },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: false,
      elements: { point: { radius: 0 } },
      scales: { y: { beginAtZero: true } },
    },
  })
}

export function addTargetDatasets(chart: Chart): void {
  chart.data.datasets.push(
    {
      label: "Target min",
      data: [],
      borderWidth: 1.5,
      borderDash: [6, 6],
      borderColor: "#22c55e",
      backgroundColor: "#22c55e",
    },
    {
      label: "Target max",
      data: [],
      borderWidth: 1.5,
      borderDash: [6, 6],
      borderColor: "#f59e0b",
      backgroundColor: "#f59e0b",
    },
  )
  chart.update("none")
}

export function resetChartData(chart: Chart): void {
  chart.data.labels = []
  chart.data.datasets.forEach((dataset) => {
    dataset.data = []
  })
  chart.update("none")
}

export function trimChartWindow(chart: Chart, maxPoints: number): void {
  if ((chart.data.labels?.length ?? 0) <= maxPoints) return
  chart.data.labels?.shift()
  chart.data.datasets.forEach((dataset) => {
    dataset.data.shift()
  })
}
