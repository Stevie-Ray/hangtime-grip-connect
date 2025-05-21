/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = "#0a7ea4"
const tintColorDark = "#fff"

export const Colors = {
  light: {
    text: "#11181C",
    background: "#fff",
    tint: tintColorLight,
    icon: "#687076",
    tabIconDefault: "#687076",
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: "#ECEDEE",
    background: "#151718",
    tint: tintColorDark,
    button: "#B1A7A6",
    card: "#161A1D",
    connected: "#15616D",
    disconnected: "#A4161A",
    confirmButton: "#4CAF50",
    resetButton: "#E5383B",
    selector: "#D3D3D3",
    tabIconSelected: tintColorDark,
    separator: "#333",
    selected: "#333333",
    selectorBackground: "#121212",
    modalBackground: "rgba(0, 0, 0, 0.6)",
  },
}
