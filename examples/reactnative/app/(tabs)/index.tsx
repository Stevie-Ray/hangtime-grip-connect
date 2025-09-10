import { Modal, Pressable, StyleSheet, Text, View } from "react-native"
import { useState } from "react"

import Max from "@/components/Max"
import { saveWorkout } from "@/components/AsyncStorage"
import { Colors } from "@/constants/Colors"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useSettings } from "@/components/SettingContext"
import { WorkoutResults } from "@/types"
import Endurance from "@/components/Endurance"

export default function HomeScreen() {
  const [modalPeak, setModalPeak] = useState(false)
  const [modalEndurance, setModalEndurance] = useState(false)
  const [modalHangTimer, setModalHangTimer] = useState(false)
  const { settings } = useSettings()

  /**
   * Function to be called when workout is finished, handles modal closing and saving results
   * @param save Boolean to determine if results should be saved
   * @param results Results of the workout
   */
  const finishWorkout = (save: boolean, results: WorkoutResults) => {
    if (modalPeak) setModalPeak(false)
    if (modalEndurance) setModalPeak(false)

    if (!save) {
      return
    }
    if (results.left === 0 && results.right === 0 && results.both === 0) {
      globalThis.alert("No results to save")
    }

    const time = new Date()
    results.time = time.toISOString()
    if (settings.activeHold) {
      results.hold = settings.activeHold
    }
    saveWorkout(results)
  }

  return (
    <>
      <View style={styles.container}>
        <View style={styles.container}>
          <Text style={styles.header}>Choose Your Mode</Text>
          <View style={styles.iconRow}>
            <Pressable style={styles.iconButton} onPress={() => setModalPeak(true)}>
              <MaterialCommunityIcons name="chart-line" size={40} color="white" />
              <Text style={styles.iconText}>Peak Load</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setModalEndurance(true)}>
              <MaterialCommunityIcons name="weight-lifter" size={40} color="white" />
              <Text style={styles.iconText}>Endurance</Text>
            </Pressable>
            <Pressable style={styles.iconButton} onPress={() => setModalHangTimer(true)}>
              <MaterialCommunityIcons name="timer-outline" size={40} color="white" />
              <Text style={styles.iconText}>Hang Timer</Text>
            </Pressable>
          </View>
        </View>
        {settings.activeHold ? (
          <>
            <Text style={styles.header}>Current hold:</Text>
            <View style={styles.holdCard}>
              <Text style={styles.cardText}>{settings.activeHold.name}</Text>
              <Text style={styles.cardText}>
                <MaterialCommunityIcons name="ruler" size={30} color="white" /> {settings.activeHold.depth} mm
              </Text>
            </View>
          </>
        ) : (
          <Text style={styles.header}>No hold selected, configure hold in settings menu</Text>
        )}
        <Modal
          visible={modalPeak}
          animationType="fade"
          onRequestClose={() => {
            setModalPeak(!modalPeak)
          }}
        >
          <Max finishWorkout={finishWorkout} />
        </Modal>
        <Modal
          visible={modalEndurance}
          animationType="fade"
          onRequestClose={() => {
            setModalEndurance(!modalEndurance)
          }}
        >
          <Endurance finishWorkout={finishWorkout} />
        </Modal>

        <Modal
          visible={modalHangTimer}
          animationType="fade"
          onRequestClose={() => {
            setModalHangTimer(!modalHangTimer)
          }}
        >
          <Text>Hang Timer</Text>
        </Modal>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.dark.background,
    padding: 20,
  },
  header: {
    fontSize: 28,
    color: "white",
    fontWeight: "bold",
    marginBottom: 20,
  },
  holdCard: {
    width: "90%",
    padding: 20,
    marginVertical: 10,
    borderRadius: 10,
    backgroundColor: Colors.dark.connected,
    alignItems: "center",
  },
  iconRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
  },
  iconButton: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 5,
    backgroundColor: Colors.dark.connected,
    borderRadius: 10,
    paddingVertical: 20,
  },
  iconText: {
    marginTop: 10,
    color: "white",
    fontSize: 14,
  },
  cardText: {
    fontSize: 20,
    color: "white",
  },
  image: {
    flex: 1,
    justifyContent: "center",
  },
  chosen: {
    color: Colors.dark.connected,
    backgroundColor: Colors.dark.card,
  },
  buttons: {
    flexDirection: "column",
    justifyContent: "center",
  },
  button: {
    marginHorizontal: 3,
    justifyContent: "center",
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "#008000",
    padding: 20,
  },
  resetButton: {
    flex: 1,
    marginHorizontal: 3,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.dark.resetButton,
  },
  nextButton: {
    flex: 1,
    marginHorizontal: 3,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.dark.connected,
    padding: 20,
  },
  current: {
    fontSize: 40,
    color: Colors.dark.connected,
  },
})
