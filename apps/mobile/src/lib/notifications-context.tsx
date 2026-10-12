import { listNotifications, markAllNotificationsRead, registerPushToken, type AppNotification } from "@reef-market/shared";
import Constants from "expo-constants";
import * as Notifications from "expo-notifications";
import { useRouter } from "expo-router";
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { AppState, Platform } from "react-native";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

/**
 * Two delivery paths, deliberately:
 *
 * 1. Realtime → local notification. Every notification is a row in the
 *    `notifications` table, written by DB triggers (see the notifications
 *    migration). This provider subscribes to the user's own rows and shows
 *    each one in the phone's notification bar via a *local* notification.
 *    Works with no Firebase at all, whenever the app process is alive.
 *
 * 2. Remote Expo push (sent by the DB via pg_net). Needed for when the app
 *    is fully closed — but on Android it requires Firebase (FCM), which
 *    this build doesn't have yet. getExpoPushTokenAsync throws without it;
 *    the previous version swallowed that silently, so no device ever
 *    registered and nothing was ever delivered.
 *
 * Once FCM is configured both paths can fire for the same event, so remote
 * pushes are suppressed while the app is in the foreground (the realtime
 * path already showed it), and the realtime path stays quiet while
 * backgrounded if remote push is working (the OS shows that one).
 */

let activeConversationId: string | null = null;
/** Called by the conversation screen on focus/blur so you're not notified about the chat you're already reading. */
export function setActiveConversationId(id: string | null) {
  activeConversationId = id;
}

Notifications.setNotificationHandler({
  handleNotification: async (notification) => {
    const trigger = notification.request.trigger as { type?: string } | null;
    const show = trigger?.type !== "push";
    return { shouldShowBanner: show, shouldShowList: show, shouldPlaySound: show, shouldSetBadge: false };
  },
});

async function ensurePermissionAndChannel(): Promise<boolean> {
  if (Platform.OS === "android") {
    // Android 13+ won't show the permission prompt until a channel exists,
    // and local notifications need it just as much as remote ones.
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      sound: "default",
    });
  }
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

async function tryRegisterRemotePush(): Promise<boolean> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken(apiClient, token);
    return true;
  } catch (err) {
    // Expected on Android until Firebase/FCM is set up — logged rather than
    // swallowed so it's visible in device logs instead of failing silently.
    console.warn("Remote push unavailable (FCM not configured?):", err instanceof Error ? err.message : err);
    return false;
  }
}

function routeFor(type: string | undefined, data: AppNotification["data"] | undefined): string | null {
  if (type === "message" && data?.conversationId) return `/messages/${data.conversationId}`;
  if ((type === "order" || type === "order_status") && data?.orderId) return `/orders/${data.orderId}`;
  if (type === "review" && data?.listingId) return `/listing/${data.listingId}`;
  return null;
}

interface NotificationsContextValue {
  unreadCount: number;
  refresh: () => Promise<void>;
  markAllRead: () => Promise<void>;
  open: (n: Pick<AppNotification, "type" | "data">) => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  unreadCount: 0,
  refresh: async () => {},
  markAllRead: async () => {},
  open: () => {},
});

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id ?? null;
  const [unreadCount, setUnreadCount] = useState(0);
  const remotePushWorking = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const { unreadCount } = await listNotifications(apiClient);
      setUnreadCount(unreadCount);
    } catch {
      // best-effort
    }
  }, []);

  const markAllRead = useCallback(async () => {
    setUnreadCount(0);
    try {
      await markAllNotificationsRead(apiClient);
    } catch {
      // best-effort — the next refresh will correct the count
    }
  }, []);

  const open = useCallback(
    (n: Pick<AppNotification, "type" | "data">) => {
      const href = routeFor(n.type, n.data);
      if (href) router.push(href as never);
    },
    [router]
  );

  // Permission, channel, remote-push registration, initial count.
  useEffect(() => {
    if (!userId) return;
    let cancelled = false;
    async function setup() {
      const granted = await ensurePermissionAndChannel();
      if (granted && !cancelled) remotePushWorking.current = await tryRegisterRemotePush();
      if (!cancelled) await refresh();
    }
    setup();
    return () => {
      cancelled = true;
    };
  }, [userId, refresh]);

  // Realtime: every new notification row for this user.
  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        (payload) => {
          const n = payload.new as AppNotification;
          if (n.type !== "message") setUnreadCount((c) => c + 1);

          if (n.type === "message" && n.data?.conversationId && n.data.conversationId === activeConversationId) return;
          if (remotePushWorking.current && AppState.currentState !== "active") return;

          Notifications.scheduleNotificationAsync({
            content: { title: n.title, body: n.body, data: { ...n.data, type: n.type }, sound: "default" },
            trigger: null,
          }).catch(() => {});
        }
      )
      .subscribe();

    const appState = AppState.addEventListener("change", (state) => {
      if (state === "active") refresh();
    });

    return () => {
      supabase.removeChannel(channel);
      appState.remove();
    };
  }, [userId, refresh]);

  // Tapping a notification (local or remote) opens the relevant screen.
  useEffect(() => {
    const sub = Notifications.addNotificationResponseReceivedListener((response) => {
      const data = response.notification.request.content.data as AppNotification["data"] & { type?: string };
      open({ type: data?.type as AppNotification["type"], data });
    });
    return () => sub.remove();
  }, [open]);

  return (
    <NotificationsContext.Provider value={{ unreadCount: userId ? unreadCount : 0, refresh, markAllRead, open }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  return useContext(NotificationsContext);
}
