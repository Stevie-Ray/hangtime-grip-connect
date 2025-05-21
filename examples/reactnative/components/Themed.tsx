/**
 * Learn more about Light and Dark modes:
 * https://docs.expo.io/guides/color-schemes/
 */

// TODO: Implement a theme system
import { Text as DefaultText, View as DefaultView } from "react-native"

import { Colors } from "@/constants/Colors"
import { useColorScheme } from "./useColorScheme"

interface ThemeProps {
  lightColor?: string
  darkColor?: string
}

export type TextProps = ThemeProps & DefaultText["props"]
export type ViewProps = ThemeProps & DefaultView["props"]

type ColorName = keyof typeof Colors.dark

export function useThemeColor(props: { light?: string; dark?: string }, colorName: ColorName) {
  const theme = useColorScheme() ?? "light"
  const colorFromProps = props[theme]

  if (colorFromProps) {
    return colorFromProps
  } else {
    return Colors[theme][colorName]
  }
}

export function Text(props: TextProps) {
  const { style, lightColor, darkColor, ...otherProps } = props
  const color = useThemeColor({ light: lightColor, dark: darkColor }, "text")

  return <DefaultText style={[{ color }, style]} {...otherProps} />
}

export function StyledView(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "background")

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />
}

export function Button(props: ViewProps) {
  const { style, lightColor, darkColor, ...otherProps } = props
  const backgroundColor = useThemeColor({ light: lightColor, dark: darkColor }, "button")

  return <DefaultView style={[{ backgroundColor }, style]} {...otherProps} />
}

export function TransparentView(props: ViewProps) {
  const { style, ...otherProps } = props
  return <DefaultView style={[{ backgroundColor: "transparent" }, style]} {...otherProps} />
}
