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
  // Switch (toggle) colors — RN's Switch needs literal on/off values for
  // both the track and the thumb (unlike trackColor, thumbColor isn't an
  // {true, false} object, so callers compute it from their own `value`).
  // Left at their platform defaults, the off-state track/thumb were both
  // near-invisible against the light background.
  switchTrackOff: "#c7ced6",
  switchThumbOff: "#6c7c93",
} as const;
