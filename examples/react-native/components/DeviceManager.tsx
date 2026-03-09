import React, { useState } from "react"
import { StyleSheet, View } from "react-native"
import DevicePicker, { DeviceType } from "@/components/DevicePicker"
import ConnectionStatusBar from "@/components/ConnectionStatusBar"
import { useSettings } from "@/components/SettingContext"
import { scanForScale, stopScan } from "@/components/ScaleConnect"

export default function DeviceManager() {
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | undefined>(undefined)
  const { settings, updateSettings } = useSettings()

  const handleDeviceChange = (deviceType: DeviceType | "") => {
    // Disconnect from current device if connected
    if (isConnected) {
      stopScan()
      setIsConnected(false)
    }

    // Update settings with new device type
    updateSettings({ deviceType })

    // If a device is selected, try to connect
    if (deviceType) {
      scanForScale(
        deviceType,
        () => {
          setIsConnected(true)
          setError(undefined)
        },
        (error: string | undefined) => {
          setIsConnected(false)
          setError(error)
        },
      )
    }
  }

  return (
    <View style={styles.container}>
      <DevicePicker selectedDevice={settings.deviceType} onDeviceChange={handleDeviceChange} />
      <ConnectionStatusBar isConnected={isConnected} error={error} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
  },
})
