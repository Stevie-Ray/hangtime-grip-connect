import { Linking } from "react-native"

/**
 * Convert a base64 string to a hex string
 * @param base64 - The base64 string to convert
 */
const base64ToHex = (base64: string): string => {
  const binary = atob(base64)
  return Array.from(binary)
    .map((char) => char.charCodeAt(0).toString(16).padStart(2, "0"))
    .join("")
}

/**
 * Parse the weight data from the manufacturer data of a WH-C06 scale
 * @param manufacturerData
 */
const parseWeightData = (manufacturerData: string | null): number => {
  if (!manufacturerData) {
    return 0
  }

  try {
    const hexData = base64ToHex(manufacturerData)
    const weightHex = hexData.substring(24, 28)
    return parseInt(weightHex, 16) / 100
  } catch (error) {
    console.error("Weight parsing error:", error)
    return 0
  }
}

/**
 * Open a URL in the default browser
 * @param url URL to open
 */
const handleUrl = async (url) => {
  const supported = await Linking.canOpenURL(url)
  if (supported) {
    await Linking.openURL(url)
  } else {
    window.alert(`Don't know how to open this URL: ${url}`)
  }
}
export { base64ToHex, parseWeightData, handleUrl }
