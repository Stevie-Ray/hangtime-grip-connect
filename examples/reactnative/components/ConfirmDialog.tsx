import React from "react"
import { Modal, View, Text, Button, StyleSheet } from "react-native"
import { Colors } from "@/constants/Colors"

const ConfirmDialog = ({ message, onConfirm, onCancel }) => {
  return (
    <Modal transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.message}>{message}</Text>
          <View style={styles.buttonContainer}>
            <View style={styles.buttonWrapper}>
              <Button title="OK" onPress={onConfirm} color="#4CAF50" />
            </View>
            <View style={styles.buttonWrapper}>
              <Button title="Cancel" onPress={onCancel} color="#F44336" />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  )
}

export default ConfirmDialog

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: Colors.dark.background,
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    backgroundColor: "#1E1E1E",
    padding: 24,
    borderRadius: 20,
    width: 320,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  message: {
    fontSize: 18,
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: 20,
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 10,
  },
  buttonWrapper: {
    flex: 1,
    marginHorizontal: 5,
    borderRadius: 10,
    overflow: "hidden",
  },
})
