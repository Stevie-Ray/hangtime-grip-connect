import React, { useRef, useState } from "react"
import { Animated, Easing, FlatList, Modal, StyleSheet, Text, TouchableOpacity, View } from "react-native"
import { MaterialCommunityIcons } from "@expo/vector-icons"
import { useSettings } from "@/components/SettingContext"
import { Colors } from "@/constants/Colors"

interface Hold {
  name: string
  depth: string
}

interface HoldsPickerProps {
  setHoldsModalVisible: (value: boolean) => void
  onValueChange: (value: Hold) => void
}

const HoldsPicker: React.FC<HoldsPickerProps> = ({ onValueChange, setHoldsModalVisible }) => {
  const [isVisible, setIsVisible] = useState(false)
  const slideAnim = useRef(new Animated.Value(0)).current
  const { settings, updateSettings } = useSettings()
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

  const selectOption = (hold: Hold) => {
    onValueChange(hold)
    closeModal()
  }

  /**
   * Remove a hold from the settings and from the active hold if it's the same
   * @param hold
   */
  const removeHold = (hold: Hold) => {
    updateSettings({
      holds: settings.holds.filter((item: Hold) => item.name !== hold.name),
      activeHold: settings.activeHold?.name === hold.name ? null : settings.activeHold,
    })
  }

  return (
    <View>
      <TouchableOpacity style={styles.selectedOption} onPress={openModal}>
        <Text style={styles.heading}>Current hold</Text>

        <Text style={styles.selectedText}>{settings.activeHold?.name ?? "Select hold"}</Text>
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
            <Text style={styles.modalTitle}>Holds</Text>
            <FlatList
              data={settings.holds}
              ListEmptyComponent={() => <Text style={styles.optionText}>No holds added</Text>}
              keyExtractor={(item) => item.name}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.option,
                    settings.activeHold && item.name === settings.activeHold.name ? styles.selectedOptionItem : {},
                  ]}
                  onPress={() => selectOption(item)}
                >
                  <Text
                    style={[
                      styles.optionText,
                      settings.activeHold && item.name === settings.activeHold.name ? styles.selectedOptionText : {},
                    ]}
                  >
                    {item.name}
                  </Text>

                  <Text
                    style={[
                      styles.optionText,
                      settings.activeHold && item.name === settings.activeHold.name ? styles.selectedOptionText : {},
                    ]}
                  >
                    {item.depth} mm
                  </Text>
                  <MaterialCommunityIcons name="delete" size={30} color="red" onPress={() => removeHold(item)} />
                </TouchableOpacity>
              )}
            />
            <TouchableOpacity style={styles.addButton} onPress={() => setHoldsModalVisible(true)}>
              <Text style={styles.addButtonText}>Add hold</Text>
            </TouchableOpacity>
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
    padding: 10,
    borderRadius: 8,
    backgroundColor: "#444",
  },
  selectedText: {
    fontSize: 16,
    color: Colors.dark.tabIconDefault,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.dark.modalBackground,
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: Colors.dark.selectorBackground,
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
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.separator,
  },
  optionText: {
    flex: 2,
    fontSize: 16,
    color: Colors.dark.text,
  },
  selectedOptionItem: {
    backgroundColor: Colors.dark.selected,
    borderRadius: 8,
  },
  selectedOptionText: {
    fontWeight: "bold",
    color: Colors.dark.text,
  },
  cancelButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: Colors.dark.resetButton,
    borderRadius: 5,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  addButtonText: {
    fontSize: 16,
    color: Colors.dark.text,
  },
  addButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: Colors.dark.confirmButton,
    borderRadius: 5,
    alignItems: "center",
  },
})

export default HoldsPicker
