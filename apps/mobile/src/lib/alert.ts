import { Alert, Platform } from "react-native";

/**
 * react-native-web's Alert.alert() is a complete no-op (see
 * node_modules/react-native-web/src/exports/Alert/index.js) — buttons wired
 * to it do nothing on web with zero feedback. These wrap the same call with
 * a window.confirm/alert fallback so the app stays usable on the web target
 * used for local browser-based testing (see apps/mobile M1 commit notes).
 */
export function notify(title: string, message?: string) {
  if (Platform.OS === "web") {
    window.alert(message ? `${title}\n\n${message}` : title);
    return;
  }
  Alert.alert(title, message);
}

export function confirmAsync(title: string, message: string, confirmLabel = "OK"): Promise<boolean> {
  if (Platform.OS === "web") {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Cancel", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
