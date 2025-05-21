import React, { useEffect, useRef, useState } from "react"
import { Dimensions } from "react-native"
import { LineChart } from "react-native-chart-kit"
import { Colors } from "@/constants/Colors"

const CHART_DURATION = 10 // Seconds
const UPDATE_INTERVAL = 500 // Milliseconds

const WeightChart = ({ weight, maxWeight }: { weight: number; maxWeight: number }) => {
  const [data, setData] = useState<number[]>(Array(CHART_DURATION * 2).fill(0))
  const dataRef = useRef<number[]>(Array(CHART_DURATION * 2).fill(0))

  // Update the chart data every interval (UPDATE_INTERVAL)
  useEffect(() => {
    const interval = setInterval(() => {
      dataRef.current = [...dataRef.current.slice(1), weight]
      setData([...dataRef.current])
    }, UPDATE_INTERVAL)

    return () => clearInterval(interval)
  }, [weight])

  return (
    <LineChart
      data={{
        labels: Array(CHART_DURATION * 2).fill(""), // Fill the labels with empty strings
        datasets: [
          {
            data: data,
            color: () => Colors.dark.connected, // Line colour
          },
          {
            data: Array(data.length).fill(maxWeight),
            color: () => Colors.dark.resetButton, // Max line colour
            withDots: false,
          },
        ],
      }}
      width={Dimensions.get("window").width}
      height={Dimensions.get("window").height / 3}
      yAxisSuffix=" kg"
      yAxisInterval={0.1}
      chartConfig={{
        backgroundGradientFrom: Colors.dark.background,
        backgroundGradientTo: Colors.dark.background,
        fillShadowGradientOpacity: 0,
        decimalPlaces: 1,
        color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`, // Y-axis colour
        labelColor: () => `rgba(255, 255, 255, 1)`, // X-axis colour
        style: {
          borderRadius: 0,
        },
        propsForDots: {
          r: "0",
        },
        propsForBackgroundLines: {
          strokeWidth: 0,
        },
      }}
      withHorizontalLabels={true}
      withVerticalLabels={false}
      withInnerLines={false}
      withOuterLines={false}
      bezier
    />
  )
}

export default WeightChart
