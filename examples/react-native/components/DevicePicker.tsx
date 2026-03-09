import React from "react"
import { Picker } from "@react-native-picker/picker"
import { StyleSheet, View } from "react-native"
import { Colors } from "@/constants/Colors"
import { Text } from "@/components/Themed"

export type DeviceType =
  | "climbro"
  | "entralpi"
  | "forceboard"
  | "motherboard"
  | "mysmartboard"
  | "pb700bt"
  | "progressor"
  | "whc06"

interface DevicePickerProps {
  selectedDevice: DeviceType | ""
  onDeviceChange: (device: DeviceType | "") => void
}

export default function DevicePicker({ selectedDevice, onDeviceChange }: DevicePickerProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Select Device</Text>
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedDevice}
          onValueChange={(value) => onDeviceChange(value as DeviceType | "")}
          style={styles.picker}
          dropdownIconColor={Colors.dark.connected}
        >
          <Picker.Item label="Select device" value="" />
          <Picker.Item label="Climbro" value="climbro" />
          <Picker.Item label="Entralpi" value="entralpi" />
          <Picker.Item label="Force Board" value="forceboard" />
          <Picker.Item label="Motherboard" value="motherboard" />
          <Picker.Item label="mySmartBoard" value="mysmartboard" enabled={false} />
          <Picker.Item label="PB-700BT" value="pb700bt" />
          <Picker.Item label="Progressor" value="progressor" />
          <Picker.Item label="WH-C06" value="whc06" />
        </Picker>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    padding: 10,
  },
  label: {
    fontSize: 16,
    marginBottom: 5,
    color: Colors.dark.connected,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: Colors.dark.connected,
    borderRadius: 8,
    overflow: "hidden",
  },
  picker: {
    height: 50,
    width: "100%",
    color: Colors.dark.text,
  },
})
