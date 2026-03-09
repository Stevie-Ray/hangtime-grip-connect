import AsyncStorage from "@react-native-async-storage/async-storage"
import { WorkoutResults } from "@/types"

export const getItem = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key)
    return value != null ? JSON.parse(value) : null
  } catch (error) {
    console.error("Error getting item:", error)
    return null
  }
}

export const saveWorkout = async (value: WorkoutResults) => {
  try {
    const existingHistory = (await getItem("workouts")) || []
    const updatedHistory = [...existingHistory, value]
    await AsyncStorage.setItem("workouts", JSON.stringify(updatedHistory))
  } catch (error) {
    console.error("Error saving workout to history:", error)
  }
}

export const getWorkoutHistory = async (): Promise<WorkoutResults[]> => {
  try {
    const history = await getItem("workouts")
    return history || []
  } catch (error) {
    console.error("Error getting workout history:", error)
    return []
  }
}

export const removeItem = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key)
  } catch (error) {
    console.error("Error removing item:", error)
  }
}
