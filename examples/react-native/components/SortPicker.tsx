import React, { useRef, useState } from "react"
import { Animated, Easing, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { Colors } from "../constants/Colors"

interface CustomPickerProps {
  title: string
  selectedValue: string
  onValueChange: (value: string) => void
  options: { label: string; value: string }[]
}

const CustomPicker: React.FC<CustomPickerProps> = ({ title, selectedValue, onValueChange, options }) => {
  const [isVisible, setIsVisible] = useState(false)
  const slideAnim = useRef(new Animated.Value(0)).current

  const openModal = () => {
    setIsVisible(true)
    Animated.timing(slideAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }).start()
  }

  const closeModal = () => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }).start(() => setIsVisible(false))
  }

  const selectOption = (value: string) => {
    onValueChange(value)
    closeModal()
  }

  return (
    <View>
      <TouchableOpacity style={styles.selectedOption} onPress={openModal}>
        <Text style={styles.heading}>{title}</Text>
        <Text style={styles.selectedText}>
          {options.find((opt) => opt.value === selectedValue)?.label || "Select an option"}
        </Text>
      </TouchableOpacity>

      <Modal visible={isVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <Animated.View
            style={[
              styles.modalContainer,
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [200, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            <Text style={styles.modalTitle}>{title}</Text>
            <FlatList
              data={options}
              keyExtractor={(item) => item.value}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[styles.option, item.value === selectedValue && styles.selectedOptionItem]}
                  onPress={() => selectOption(item.value)}
                >
                  <Text style={[styles.optionText, item.value === selectedValue && styles.selectedOptionText]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.cancelButton} onPress={closeModal}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: Colors.dark.text,
  },
  selectedOption: {
    borderWidth: 1,
    borderColor: "#444",
    padding: 10,
    borderRadius: 8,
    marginBottom: 20,
    backgroundColor: "#1E1E1E",
  },
  selectedText: {
    fontSize: 16,
    color: "#CCCCCC",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "#121212",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: "50%",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    color: Colors.dark.text,
  },
  option: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.separator,
  },
  optionText: {
    fontSize: 16,
    color: Colors.dark.tabIconDefault,
  },
  selectedOptionItem: {
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
  },
  selectedOptionText: {
    fontWeight: "bold",
    color: Colors.dark.text,
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: Colors.dark.disconnected,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
})

export default CustomPicker
