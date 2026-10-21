import { deleteOwnAccount, getOwnProfile, type Profile } from "@reef-market/shared";
import { Image } from "expo-image";
import { useFocusEffect, useRouter } from "expo-router";
import { Heart, LogOut, MapPin, Pencil, ShieldCheck, Wrench } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthGate } from "@/components/AuthGate";
import { BlockedUsersSection } from "@/components/BlockedUsersSection";
import { EarningsSection } from "@/components/EarningsSection";
import { EditProfileModal } from "@/components/EditProfileModal";
import { PayoutsSection } from "@/components/PayoutsSection";
import { ProfileCompletion } from "@/components/ProfileCompletion";
import { PromoCodeSection } from "@/components/PromoCodeSection";
import { SavedSearchesSection } from "@/components/SavedSearchesSection";
import { SubscriptionSection } from "@/components/SubscriptionSection";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { useAuth } from "@/lib/auth-context";
import { useLanguagePrefs } from "@/lib/language-context";
import { supabase } from "@/lib/supabase";
import { themeColors } from "@/lib/theme-colors";
import { usePayoutStatus } from "@/lib/use-payout-status";

export default function ProfileScreen() {
  const { session } = useAuth();
  const { savePrefs } = useLanguagePrefs();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [editing, setEditing] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // One payout-status fetch shared by the completion meter and the
  // payouts card, refreshed on focus (status changes after returning from
  // Stripe's onboarding in the browser).
  const payout = usePayoutStatus();
  const { refresh: refreshPayout } = payout;
  useFocusEffect(
    useCallback(() => {
      if (session) refreshPayout();
    }, [session, refreshPayout])
  );

  useEffect(() => {
    if (!session) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
    getOwnProfile(apiClient)
      .then(({ profile }) => setProfile(profile))
      .finally(() => setLoading(false));
  }, [session]);

  function handleSaved(updated: Profile) {
    setProfile(updated);
    setEditing(false);
    setSavedNotice(true);
    // Keep the app-wide language context in sync so useT() picks up the
    // change immediately, without waiting for a reload — see language-context.tsx.
    savePrefs(updated.language, updated.country ?? "US");
  }

  async function handleDeleteAccount() {
    const confirmed = await confirmAsync("Delete your account?", "This can't be undone. You'll be signed out immediately.", "Delete");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await deleteOwnAccount(apiClient);
      await supabase.auth.signOut();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to delete account");
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator color={themeColors.primary} />
      </SafeAreaView>
    );
  }

  if (!session) {
    return <AuthGate title="Sign in to view your profile" message="Create an account to manage your listings, payouts, and account settings." />;
  }

  return (
    <SafeAreaView edges={["top"]} className="flex-1 bg-background">
      <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
        <Text className="text-xl font-bold text-foreground">My Profile</Text>

        <View className="rounded-xl border border-border bg-card p-4">
          <View className="flex-row items-start gap-4">
            <View className="w-16 h-16 rounded-full overflow-hidden bg-muted items-center justify-center shrink-0">
              {profile?.avatar_url ? (
                <Image source={{ uri: profile.avatar_url }} style={{ width: 64, height: 64 }} contentFit="cover" />
              ) : (
                <Text className="text-2xl">👤</Text>
              )}
            </View>
            <View className="flex-1 min-w-0">
              <Text className="text-lg font-bold text-foreground" numberOfLines={1}>
                {profile?.display_name || "Add your name"}
              </Text>
              <Text className="text-sm text-muted-foreground" numberOfLines={1}>
                {session.user.email}
              </Text>
              {!!profile?.location && (
                <View className="flex-row items-center gap-1 mt-1">
                  <MapPin size={12} color={themeColors.mutedForeground} />
                  <Text className="text-xs text-muted-foreground" numberOfLines={1}>
                    {profile.location}
                  </Text>
                </View>
              )}
              {!!profile?.bio && (
                <Text className="text-xs text-muted-foreground mt-1" numberOfLines={2}>
                  {profile.bio}
                </Text>
              )}
              {profile && (
                <View className="flex-row items-center flex-wrap gap-2 mt-2">
                  {profile.verified_seller && (
                    <View className="bg-emerald-100 rounded-full px-2 py-0.5">
                      <Text className="text-[11px] font-semibold text-emerald-800">✓ Verified Seller</Text>
                    </View>
                  )}
                  <Text className="text-xs text-muted-foreground">{profile.completed_sales_count} sales</Text>
                </View>
              )}
            </View>
            <Pressable
              testID="edit-profile-button"
              onPress={() => {
                setSavedNotice(false);
                setEditing(true);
              }}
              disabled={!profile}
              hitSlop={8}
              className="flex-row items-center gap-1 rounded-full px-3 py-1.5 bg-primary/10"
            >
              <Pencil size={13} color={themeColors.primary} />
              <Text className="text-xs font-semibold text-primary">Edit</Text>
            </Pressable>
          </View>

          <ProfileCompletion profile={profile} payoutsEnabled={payout.payoutsEnabled} onEdit={() => setEditing(true)} onConnectPayouts={payout.connect} />
        </View>

        {savedNotice && (
          <View className="rounded-xl bg-emerald-50 px-3 py-2.5 -mt-1">
            <Text className="text-sm font-medium text-emerald-800">✓ Profile saved</Text>
          </View>
        )}

        <View className="flex-row gap-3">
          <Pressable onPress={() => router.push("/saved")} className="flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 py-3">
            <Heart size={16} color={themeColors.foreground} />
            <Text className="text-sm font-semibold text-foreground">Saved Listings</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/services")} className="flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-card px-3 py-3">
            <Wrench size={16} color={themeColors.foreground} />
            <Text className="text-sm font-semibold text-foreground">Services</Text>
          </Pressable>
        </View>

        {profile?.role === "admin" && (
          <Pressable onPress={() => router.push("/admin")} className="flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3">
            <ShieldCheck size={16} color={themeColors.foreground} />
            <Text className="text-sm font-semibold text-foreground">Admin</Text>
          </Pressable>
        )}

        <SubscriptionSection />
        <PayoutsSection status={payout} />
        <EarningsSection />
        <SavedSearchesSection />
        <PromoCodeSection />
        <BlockedUsersSection />

        <Pressable onPress={() => supabase.auth.signOut()} className="flex-row items-center justify-center gap-2 bg-muted rounded-xl py-3 mt-2">
          <LogOut size={16} color={themeColors.foreground} />
          <Text className="font-semibold text-sm text-foreground">Sign Out</Text>
        </Pressable>

        <Pressable testID="delete-account-button" onPress={handleDeleteAccount} disabled={deleting} className="items-center py-2">
          {deleting ? <ActivityIndicator color={themeColors.destructive} /> : <Text className="font-semibold text-sm text-destructive">Delete Account</Text>}
        </Pressable>

        <View className="flex-row justify-center gap-4 pt-2 flex-wrap">
          <Pressable onPress={() => router.push("/support")}>
            <Text className="text-xs text-muted-foreground underline">Support</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/terms")}>
            <Text className="text-xs text-muted-foreground underline">Terms of Service</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/privacy")}>
            <Text className="text-xs text-muted-foreground underline">Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>

      {editing && profile && <EditProfileModal profile={profile} onClose={() => setEditing(false)} onSaved={handleSaved} />}
    </SafeAreaView>
  );
}
