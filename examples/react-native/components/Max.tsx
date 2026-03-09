import React, { useRef, useState } from "react"
import ConnectionStatusBar from "@/components/ConnectionStatusBar"
import { useFocusEffect } from "expo-router"
import { StyledView, Text } from "@/components/Themed"
import { Pressable, StyleSheet, View } from "react-native"
import MaxLine from "@/components/MaxLine"
import { Colors } from "@/constants/Colors"
import { WorkoutResults } from "@/types"
import { useSettings } from "@/components/SettingContext"
import { scanForScale, stopScan } from "@/components/ScaleConnect"

interface MaxProps {
  finishWorkout: (save: boolean, results: WorkoutResults) => void
}

export default function Max({ finishWorkout }: MaxProps) {
  const Hands = {
    BOTH: "Both hands",
    RIGHT: "Right hand",
    LEFT: "Left hand",
  } as const

  type HandType = (typeof Hands)[keyof typeof Hands]
  const [weight, setWeight] = useState(0)
  const [isConnected, setIsConnected] = useState(false)
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  const [currentHand, setCurrentHand] = useState<HandType>(Hands.BOTH)
  const [currentMax, setCurrentMax] = useState(0)
  const maxLeftRef = useRef(0)
  const maxRightRef = useRef(0)
  const maxBothRef = useRef(0)
  const [error, setError] = useState<string | undefined>(undefined)
  const { settings } = useSettings()

  const updateMax = (weight: number) => {
    setCurrentMax((prev) => (weight > prev ? weight : prev))
  }

  const updateConnectionStatus = () => {
    setIsConnected(true)
    if (error) {
      setError(undefined)
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }

    // Set a timeout to disconnect if the scale is not found and the weight is not updated
    timeoutRef.current = setTimeout(() => {
      setIsConnected(false)
      setWeight(0)
    }, 2000) as unknown as NodeJS.Timeout
  }

  const setNewWeight = (newWeight: number) => {
    setWeight(newWeight)
    updateMax(newWeight)
    updateConnectionStatus()
  }

  useFocusEffect(
    React.useCallback(() => {
      if (!settings.deviceType) {
        setError("No device selected")
        return
      }
      scanForScale(settings.deviceType, setNewWeight, setError)
      return () => {
        stopScan()
        setIsConnected(false)
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current)
        }
      }
    }, [settings.deviceType]),
  )

  const finish = (save: boolean) => {
    switch (currentHand) {
      case Hands.BOTH:
        maxBothRef.current = currentMax
        break
      case Hands.RIGHT:
        maxRightRef.current = currentMax
        break
      case Hands.LEFT:
        maxLeftRef.current = currentMax
        break
    }

    const results = {
      left: maxLeftRef.current,
      right: maxRightRef.current,
      both: maxBothRef.current,
      mode: "Max",
    }
    finishWorkout(save, results)
  }

  const resetMax = () => {
    setCurrentMax(0)
  }

  const changeHands = () => {
    setCurrentHand((prevHand) => {
      switch (prevHand) {
        case Hands.BOTH:
          maxBothRef.current = currentMax
          setCurrentMax(maxRightRef.current)
          return Hands.RIGHT
        case Hands.RIGHT:
          maxRightRef.current = currentMax
          setCurrentMax(maxLeftRef.current)
          return Hands.LEFT
        case Hands.LEFT:
          maxLeftRef.current = currentMax
          setCurrentMax(maxBothRef.current)
          return Hands.BOTH
      }
    })
  }

  return (
    <>
      <StyledView style={styles.container}>
        <Text style={styles.header}>{currentHand}</Text>
        <Text style={styles.header}>
          {settings.activeHold?.name} {settings.activeHold?.depth} mm
        </Text>
        <View style={styles.cards}>
          <View style={styles.card}>
            <Text style={styles.current}>{weight}</Text>
            <Text style={styles.kg}>Current kg</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.maxval}>{currentMax}</Text>
            <Text style={styles.kg}>MAX kg</Text>
          </View>
        </View>
        <View style={styles.line}>
          <MaxLine weight={weight} maxWeight={currentMax} />
        </View>
        <View style={styles.buttons}>
          <Pressable style={styles.nextButton} onPress={() => changeHands()}>
            <Text>Change hand</Text>
          </Pressable>
        </View>
        <View style={styles.buttons}>
          <Pressable style={styles.resetButton} onPress={() => resetMax()}>
            <Text>Reset max</Text>
          </Pressable>

          <Pressable style={styles.resetButton} onPress={() => finish(false)}>
            <Text>Cancel</Text>
          </Pressable>

          <Pressable style={styles.button} onPress={() => finish(true)}>
            <Text>Save</Text>
          </Pressable>
        </View>
        <ConnectionStatusBar isConnected={isConnected} error={error} />
      </StyledView>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    paddingTop: 10,
    marginBottom: 10,
    fontSize: 35,
    textAlign: "center",
    color: Colors.dark.connected,
  },
  container: {
    paddingTop: 20,
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    padding: 0,
  },
  line: {
    flex: 0.9,
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: Colors.dark.card,
    borderRadius: 10,
    padding: 30,
    marginHorizontal: 12,
    marginTop: 30,
    alignItems: "center",
    margin: 0,
  },
  cards: {
    flexDirection: "row",
    justifyContent: "space-evenly",
  },
  buttons: {
    flexDirection: "row",
    justifyContent: "center",
    marginBottom: 5,
    padding: 3,
    marginTop: 0,
  },
  button: {
    flex: 1,
    marginHorizontal: 3,
    justifyContent: "center",
    paddingHorizontal: 10,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: Colors.dark.confirmButton,
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
  kg: {
    fontSize: 30,
  },
  maxval: {
    fontSize: 40,
    color: Colors.dark.resetButton,
  },
})
