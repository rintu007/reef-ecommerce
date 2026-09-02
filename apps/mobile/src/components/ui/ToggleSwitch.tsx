import { Switch, type SwitchProps } from "react-native";
import { themeColors } from "@/lib/theme-colors";

/**
 * Thin wrapper around RN's Switch with explicit on/off track + thumb colors.
 * Left to platform defaults (just `trackColor={{ true: primary, false:
 * undefined }}`), the off state rendered as a near-invisible light-gray
 * track with a light thumb — impossible to tell it was interactive against
 * this app's light background. On: blue track, white thumb (unchanged).
 * Off: gray track, dark-gray thumb, so the toggle reads clearly either way.
 */
export function ToggleSwitch({ value, ...props }: SwitchProps) {
  return (
    <Switch
      value={value}
      trackColor={{ true: themeColors.primary, false: themeColors.switchTrackOff }}
      thumbColor={value ? themeColors.white : themeColors.switchThumbOff}
      {...props}
    />
  );
}
