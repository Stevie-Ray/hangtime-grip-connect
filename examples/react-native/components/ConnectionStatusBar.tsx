import React from "react"
import { StyleSheet, Text, View } from "react-native"
import { Colors } from "@/constants/Colors"
import { ConnectionStatusBarProps } from "@/types"

export default function ConnectionStatusBar({ isConnected, error }: ConnectionStatusBarProps) {
  return (
    <View style={[styles.statusBar, isConnected ? styles.connected : styles.disconnected]}>
      <Text style={styles.statusText}>{isConnected ? "Scale Connected" : error ? error : "Scale Disconnected"}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  statusBar: {
    width: "100%",
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  connected: {
    backgroundColor: Colors.dark.connected,
  },
  disconnected: {
    backgroundColor: Colors.dark.disconnected,
  },
  statusText: {
    color: "white",
    fontSize: 12,
  },
})
