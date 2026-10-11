import { registerPushToken } from "@reef-market/shared";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { useEffect } from "react";
import { Platform } from "react-native";
import { apiClient } from "@/lib/api-client";

// Foreground notifications are suppressed by default — without this handler
// a message/order push while the app is open would just silently do
// nothing, which defeats the point ("work like Messenger").
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

async function registerForPush(): Promise<string | null> {
  if (Platform.OS === "android") {
    // Android 13+ won't even show the permission prompt until a channel exists.
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
    });
  }

  const { status: existing } = await Notifications.getPermissionsAsync();
  let status = existing;
  if (existing !== "granted") {
    const result = await Notifications.requestPermissionsAsync();
    status = result.status;
  }
  if (status !== "granted") return null;

  const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
  const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
  return token;
}

/** Mounted once in the root layout (see _layout.tsx) when there's a session — registers this device for push, and routes to the right screen when a notification is tapped. */
export function usePushNotifications(enabled: boolean) {
  const router = useRouter();

  useEffect(() => {
    if (!enabled) return;

    registerForPush()
      .then((token) => {
        if (token) return registerPushToken(apiClient, token);
      })
      .catch(() => {
        // best-effort — a declined permission or offline registration call
        // shouldn't block anything else in the app
      });
  }, [enabled]);

  useEffect(() => {
    const subscription = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as { type?: string; conversationId?: string; orderId?: string };
      if (data?.type === "message" && data.conversationId) {
        router.push(`/messages/${data.conversationId}`);
      } else if (data?.type === "order" && data.orderId) {
        router.push(`/orders/${data.orderId}`);
      }
    });
    return () => subscription.remove();
  }, [router]);
}
