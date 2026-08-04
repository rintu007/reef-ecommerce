/**
 * Icon `color` props take a literal color value, not a className — lucide-react-native
 * icons aren't NativeWind-styled. Mirrors the light-mode values in ../global.css.
 */
export const themeColors = {
  primary: "#0b81b7",
  accent: "#ee5f2b",
  destructive: "#dc2828",
  mutedForeground: "#6c7c93",
  foreground: "#171d26",
  border: "#e0e6eb",
  white: "#ffffff",
} as const;
