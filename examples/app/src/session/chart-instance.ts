import { Chart } from "chart.js/auto"

export function createSessionChart(chartElement: HTMLCanvasElement): Chart {
  const isMobileViewport =
    typeof window !== "undefined" &&
    typeof window.matchMedia === "function" &&
    window.matchMedia("(max-width: 640px)").matches

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
      plugins: {
        legend: {
          labels: {
            font: {
              size: isMobileViewport ? 10 : 12,
            },
            boxWidth: isMobileViewport ? 18 : 24,
          },
        },
      },
      scales: {
        x: {
          ticks: {
            autoSkip: true,
            maxTicksLimit: isMobileViewport ? 5 : 10,
            maxRotation: 0,
            minRotation: 0,
            font: {
              size: isMobileViewport ? 9 : 11,
            },
          },
        },
        y: {
          beginAtZero: true,
          ticks: {
            font: {
              size: isMobileViewport ? 10 : 11,
            },
          },
        },
      },
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
