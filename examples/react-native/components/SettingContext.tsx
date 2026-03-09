import React, { createContext, useContext, useEffect, useState } from "react"
import AsyncStorage from "@react-native-async-storage/async-storage"
import { AppSettings, SettingsProviderProps } from "@/types"
import { DeviceType } from "@/components/DevicePicker"

interface SettingsContextType {
  settings: AppSettings
  updateSettings: (newSettings: Partial<AppSettings>) => void
}

const DEFAULT_SETTINGS: AppSettings = {
  activeHold: { name: "Crimp", depth: "20" },
  holds: [{ name: "Crimp", depth: "20" }],
  weighThreshold: 10,
  beep: true,
  deviceType: "" as DeviceType | "",
}

const SettingsContext = createContext<SettingsContextType>({
  settings: DEFAULT_SETTINGS,
  updateSettings: () => {
    console.warn("SettingsContext used outside of SettingsProvider")
  },
})

export const SettingsProvider: React.FC<SettingsProviderProps> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS)
  const [loading, setLoading] = useState<boolean>(true)

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedSettings = await AsyncStorage.getItem("appSettings")
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings))
        } else {
          setSettings(DEFAULT_SETTINGS)
        }
      } catch (error) {
        console.error("Error loading settings:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSettings()
  }, [])

  // Save settings to AsyncStorage when they change
  useEffect(() => {
    const saveSettings = async () => {
      try {
        await AsyncStorage.setItem("appSettings", JSON.stringify(settings))
      } catch (error) {
        console.error("Error saving settings:", error)
      }
    }

    if (!loading) {
      saveSettings()
    }
  }, [settings, loading])

  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings((prevSettings) => ({
      ...prevSettings,
      ...newSettings,
    }))
  }

  if (loading) {
    return <LoadingScreen />
  }

  return <SettingsContext.Provider value={{ settings, updateSettings }}>{children}</SettingsContext.Provider>
}

export const useSettings = (): SettingsContextType => {
  return useContext(SettingsContext)
}

// TODO: If needed
const LoadingScreen = () => <></>
