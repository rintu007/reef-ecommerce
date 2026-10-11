import { useAuth } from "@/lib/auth-context";
import { usePushNotifications } from "@/lib/use-push-notifications";

/** Renders nothing — just a place to run the push-notification registration/listener hook inside AuthProvider's tree (the hook itself needs useAuth, which RootLayout can't call directly since it's the one rendering AuthProvider). */
export function PushNotificationRegistrar() {
  const { session } = useAuth();
  usePushNotifications(!!session);
  return null;
}
