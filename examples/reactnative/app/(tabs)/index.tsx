import { Platform, StyleSheet, TouchableOpacity, PermissionsAndroid } from "react-native"
import { Picker } from "@react-native-picker/picker"
import { useState } from "react"

import { HelloWave } from "@/components/HelloWave"
import ParallaxScrollView from "@/components/ParallaxScrollView"
import { ThemedText } from "@/components/ThemedText"
import { ThemedView } from "@/components/ThemedView"
import {
  Climbro,
  Entralpi,
  ForceBoard,
  KilterBoard,
  Motherboard,
  mySmartBoard,
  Progressor,
  SmartBoardPro,
  WHC06,
} from "@hangtime/grip-connect-react-native"
import type { massObject } from "@hangtime/grip-connect/src/interfaces/callback.interface"

type DeviceType =
  | Climbro
  | Entralpi
  | ForceBoard
  | KilterBoard
  | Motherboard
  | mySmartBoard
  | Progressor
  | SmartBoardPro
  | WHC06

export default function HomeScreen() {
  const [selectedDevice, setSelectedDevice] = useState<string>("")
  const [device, setDevice] = useState<DeviceType | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [hasPermissions, setHasPermissions] = useState<boolean | null>(null)

  const devices = [
    { value: "climbro", label: "Climbro", disabled: true },
    { value: "entralpi", label: "Entralpi" },
    { value: "forceboard", label: "Force Board" },
    { value: "kilterboard", label: "Kilter Board" },
    { value: "motherboard", label: "Motherboard" },
    { value: "smartboard", label: "mySmartBoard", disabled: true },
    { value: "progressor", label: "Progressor" },
    { value: "smartboardpro", label: "Smart Board Pro" },
    { value: "whc06", label: "WH-C06" },
  ]

  const createDevice = (type: string) => {
    switch (type) {
      case "climbro":
        return new Climbro()
      case "entralpi":
        return new Entralpi()
      case "forceboard":
        return new ForceBoard()
      case "kilterboard":
        return new KilterBoard()
      case "motherboard":
        return new Motherboard()
      case "smartboard":
        return new mySmartBoard()
      case "progressor":
        return new Progressor()
      case "smartboardpro":
        return new SmartBoardPro()
      case "whc06":
        return new WHC06()
      default:
        return null
    }
  }

  const requestBluetoothPermission = async () => {
    if (Platform.OS === "ios") {
      return true
    }
    if (Platform.OS === "android" && PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION) {
      const apiLevel = parseInt(Platform.Version.toString(), 10)

      if (apiLevel < 31) {
        const granted = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION)
        return granted === PermissionsAndroid.RESULTS.GRANTED
      }
      if (PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN && PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT) {
        const result = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        ])

        return (
          result["android.permission.BLUETOOTH_CONNECT"] === PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.BLUETOOTH_SCAN"] === PermissionsAndroid.RESULTS.GRANTED &&
          result["android.permission.ACCESS_FINE_LOCATION"] === PermissionsAndroid.RESULTS.GRANTED
        )
      }
    }
    return false
  }

  const handleDeviceSelect = async (value: string) => {
    const permissionsGranted = await requestBluetoothPermission()
    setHasPermissions(permissionsGranted)

    if (!permissionsGranted) {
      console.error("Bluetooth permissions not granted")
      return
    }

    setSelectedDevice(value)
    if (value) {
      const newDevice = createDevice(value)
      setDevice(newDevice)
    } else {
      setDevice(null)
    }
  }

  const handleConnect = async () => {
    if (!device) return

    try {
      await device.connect(
        async () => {
          device.notify((data: massObject) => {
            console.log(data)
          })

          if ("battery" in device) {
            const batteryLevel = await device.battery()
            if (batteryLevel) {
              console.log("Battery Level:", batteryLevel)
            }
          }

          if ("firmware" in device) {
            const firmwareRevision = await device.firmware()
            if (firmwareRevision) {
              console.log("Firmware Revision:", firmwareRevision)
            }
          }

          if ("stream" in device) {
            await device.stream()
          }
          setIsConnected(true)
        },
        (error: Error) => {
          console.log(error)
        },
      )
    } catch (error) {
      console.error("Error connecting to device:", error)
    }
  }

  const handleDisconnect = async () => {
    if (!device) return

    try {
      await device.disconnect()
      setIsConnected(false)
    } catch (error) {
      console.error("Error disconnecting from device:", error)
    }
  }

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: "#D0D0D0", dark: "#353636" }}
      headerImage={<ThemedText style={styles.headerText}>Hangtime Grip Connect</ThemedText>}
    >
      <ThemedView style={styles.titleContainer}>
        <ThemedText type="title">Welcome!</ThemedText>
        <HelloWave />
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Bluetooth LE Demo</ThemedText>
        <ThemedText>Select a device to connect:</ThemedText>
        <Picker selectedValue={selectedDevice} onValueChange={handleDeviceSelect} style={styles.picker}>
          <Picker.Item label="Select device" value="" />
          {devices.map((device) => (
            <Picker.Item key={device.value} label={device.label} value={device.value} enabled={!device.disabled} />
          ))}
        </Picker>

        {hasPermissions === false && (
          <ThemedText style={styles.errorText}>Bluetooth permissions are required to connect to devices.</ThemedText>
        )}

        {device && (
          <ThemedView style={styles.deviceContainer}>
            <ThemedText type="defaultSemiBold">{device.constructor.name}</ThemedText>
            <ThemedView style={styles.buttonGroup}>
              <TouchableOpacity
                style={[styles.button, isConnected && styles.buttonDisabled]}
                onPress={handleConnect}
                disabled={isConnected}
              >
                <ThemedText style={styles.buttonText}>Connect</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, !isConnected && styles.buttonDisabled]}
                onPress={handleDisconnect}
                disabled={!isConnected}
              >
                <ThemedText style={styles.buttonText}>Disconnect</ThemedText>
              </TouchableOpacity>
            </ThemedView>
          </ThemedView>
        )}
      </ThemedView>

      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 1: Try it</ThemedText>
        <ThemedText>
          Edit <ThemedText type="defaultSemiBold">app/(tabs)/index.tsx</ThemedText> to see changes. Press{" "}
          <ThemedText type="defaultSemiBold">
            {Platform.select({
              ios: "cmd + d",
              android: "cmd + m",
              web: "F12",
            })}
          </ThemedText>{" "}
          to open developer tools.
        </ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 2: Explore</ThemedText>
        <ThemedText>{`Tap the Explore tab to learn more about what's included in this starter app.`}</ThemedText>
      </ThemedView>
      <ThemedView style={styles.stepContainer}>
        <ThemedText type="subtitle">Step 3: Get a fresh start</ThemedText>
        <ThemedText>
          {`When you're ready, run `}
          <ThemedText type="defaultSemiBold">npm run reset-project</ThemedText> to get a fresh{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> directory. This will move the current{" "}
          <ThemedText type="defaultSemiBold">app</ThemedText> to{" "}
          <ThemedText type="defaultSemiBold">app-example</ThemedText>.
        </ThemedText>
      </ThemedView>
    </ParallaxScrollView>
  )
}

const styles = StyleSheet.create({
  titleContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  stepContainer: {
    gap: 8,
    marginBottom: 8,
  },
  reactLogo: {
    height: 178,
    width: 290,
    bottom: 0,
    left: 0,
    position: "absolute",
  },
  picker: {
    width: "100%",
    maxWidth: 300,
    height: 50,
    backgroundColor: "#fff",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  deviceContainer: {
    marginTop: 16,
    gap: 8,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
  },
  button: {
    flex: 1,
    padding: 10,
    backgroundColor: "#73B5F6",
    borderRadius: 3,
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "#fff",
  },
  errorText: {
    color: "#ff0000",
    marginTop: 8,
  },
  headerText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
  },
})
