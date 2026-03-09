import React, { useState } from "react"
import { Button, Modal, StyleSheet, Text, TextInput, View } from "react-native"
import { Hold, HoldsModalProps } from "@/types"

const HoldsModal: React.FC<HoldsModalProps> = ({ onClose, onSave }) => {
  const [holdName, setHoldName] = useState("")
  const [holdDepth, setHoldDepth] = useState("")

  const handleSave = () => {
    if (!holdName.trim() || !holdDepth.trim()) {
      alert("Please fill in both fields before saving.")
      return
    }

    const holdData: Hold = {
      name: holdName,
      depth: holdDepth,
    }
    onSave(holdData)
    resetForm()
    onClose()
  }

  const resetForm = () => {
    setHoldName("")
    setHoldDepth("")
  }

  return (
    <Modal>
      <View style={styles.modalContainer}>
        <Text style={styles.title}>Add a New Hold</Text>
        <TextInput
          style={styles.input}
          autoFocus
          placeholder="Enter hold name"
          maxLength={20}
          value={holdName}
          onChangeText={setHoldName}
          placeholderTextColor="#bbb"
        />
        <TextInput
          style={styles.input}
          maxLength={3}
          placeholder="Enter hold depth or diameter (mm)"
          value={holdDepth}
          onChangeText={setHoldDepth}
          keyboardType="numeric"
          placeholderTextColor="#bbb"
        />
        <View style={styles.buttonsContainer}>
          <Button title="Save" onPress={handleSave} color="#4CAF50" />
          <Button title="Cancel" onPress={onClose} color="#dc2626" />
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    backgroundColor: "#1E1E1E",
    padding: 20,
    borderRadius: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
    color: "#fff",
  },
  input: {
    height: 40,
    borderColor: "#444",
    borderWidth: 1,
    marginBottom: 10,
    borderRadius: 5,
    paddingLeft: 10,
    color: "#fff",
  },
  buttonsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
})

export default HoldsModal
