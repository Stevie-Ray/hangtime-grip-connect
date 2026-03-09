import React, { useState } from "react"
import { useFocusEffect } from "expo-router"
import { getWorkoutHistory } from "@/components/AsyncStorage"
import { FlatList, StyleSheet, Text, View } from "react-native"
import CustomPicker from "@/components/SortPicker"
import { Colors } from "@/constants/Colors"

const OPTIONS = [
  { label: "Ascending by time", value: "ascending" },
  { label: "Descending by time", value: "descending" },
  { label: "Ascending by mode", value: "ascendingM" },
  { label: "By Max right hand", value: "maxRight" },
  { label: "By Max left hand", value: "maxLeft" },
  { label: "By Max both hands", value: "maxBoth" },
]

export default function History() {
  const [workoutHistory, setWorkoutHistory] = useState([])
  const [sortOrder, setSortOrder] = useState<"ascending" | "descending">("ascending")

  useFocusEffect(
    // Get workout history when the screen is focused
    React.useCallback(() => {
      getWorkoutHistory().then((value) => {
        value.forEach((workout) => {
          workout.date = new Date(workout.time)
          workout.time = workout.date.toLocaleString()
        })
        value.sort((a, b) => b.date - a.date)
        setWorkoutHistory(value)
      })
      return () => {
        console.log("unmounting")
      }
    }, []),
  )

  const sortHistory = (order) => {
    const sortedHistory = [...workoutHistory].sort((a, b) => {
      if (order === "ascendingM") {
        return a.mode.localeCompare(b.mode)
      }
      if (order === "maxRight") {
        return b.right - a.right
      }
      if (order === "maxLeft") {
        return b.left - a.left
      }
      if (order === "maxBoth") {
        return b.both - a.both
      }
      return order === "ascending" ? a.date - b.date : b.date - a.date
    })
    setWorkoutHistory(sortedHistory)
  }

  const handleSortChange = (value: "ascending" | "descending") => {
    setSortOrder(value)
    sortHistory(value)
  }

  // History item renderer
  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.text}>{item.time}</Text>
      <Text style={styles.textSecondary}>{item.mode}</Text>
      {item.both ? <Text style={styles.textSecondary}>Both hands: {item.both}</Text> : null}
      {item.left ? <Text style={styles.textSecondary}>Left hand: {item.left}</Text> : null}
      {item.right ? <Text style={styles.textSecondary}>Right hand: {item.right}</Text> : null}
    </View>
  )

  return (
    <View style={styles.container}>
      <CustomPicker
        title="Sort by:"
        selectedValue={sortOrder}
        options={OPTIONS}
        onValueChange={(value) => handleSortChange(value as "ascending" | "descending")}
      />
      <FlatList
        data={workoutHistory}
        renderItem={renderItem}
        keyExtractor={(item) => item.time}
        ListEmptyComponent={() => <Text style={styles.text}>No history</Text>}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    padding: 10,
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    color: Colors.dark.text,
    fontWeight: "bold",
  },
  textSecondary: {
    fontSize: 14,
    color: Colors.dark.text,
  },
})
