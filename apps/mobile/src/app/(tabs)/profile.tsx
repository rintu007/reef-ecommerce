import { deleteOwnAccount, getOwnProfile, updateOwnProfile, LANGUAGES, type LanguageCode, type Profile } from "@reef-market/shared";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { Heart, LogOut, Plus, ShieldCheck, Wrench, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AuthGate } from "@/components/AuthGate";
import { BlockedUsersSection } from "@/components/BlockedUsersSection";
import { PayoutsSection } from "@/components/PayoutsSection";
import { PromoCodeSection } from "@/components/PromoCodeSection";
import { SavedSearchesSection } from "@/components/SavedSearchesSection";
import { SubscriptionSection } from "@/components/SubscriptionSection";
import { apiClient } from "@/lib/api-client";
import { confirmAsync, notify } from "@/lib/alert";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { themeColors } from "@/lib/theme-colors";
import { uploadPhotoFromUri } from "@/lib/uploads";

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-sm font-medium text-muted-foreground mb-1">{children}</Text>;
}

const inputClassName = "border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground";

export default function ProfileScreen() {
  const { session } = useAuth();
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [bio, setBio] = useState("");
  const [location, setLocation] = useState("");
  const [country, setCountry] = useState("");
  const [language, setLanguage] = useState<LanguageCode>("en");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [tankPhotos, setTankPhotos] = useState<string[]>([]);
  const [uploadingTankPhoto, setUploadingTankPhoto] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!session) {
      const timer = setTimeout(() => setLoading(false), 0);
      return () => clearTimeout(timer);
    }
    getOwnProfile(apiClient)
      .then(({ profile }) => {
        setProfile(profile);
        setDisplayName(profile.display_name ?? "");
        setBio(profile.bio ?? "");
        setLocation(profile.location ?? "");
        setCountry(profile.country ?? "");
        setLanguage(profile.language);
        setAvatarUrl(profile.avatar_url);
        setTankPhotos(profile.tank_photos);
      })
      .finally(() => setLoading(false));
  }, [session]);

  async function handleAvatarPick() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;

    setUploadingAvatar(true);
    setError(null);
    try {
      const asset = result.assets[0];
      const ext = asset.fileName?.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? ".jpg";
      const url = await uploadPhotoFromUri("avatars", asset.uri, `avatar${ext}`);
      setAvatarUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Avatar upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAddTankPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;

    setUploadingTankPhoto(true);
    setError(null);
    try {
      const asset = result.assets[0];
      const ext = asset.fileName?.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? ".jpg";
      const url = await uploadPhotoFromUri("tank-photos", asset.uri, `tank-${Date.now()}${ext}`);
      setTankPhotos((prev) => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Tank photo upload failed");
    } finally {
      setUploadingTankPhoto(false);
    }
  }

  function handleRemoveTankPhoto(url: string) {
    setTankPhotos((prev) => prev.filter((p) => p !== url));
  }

  async function handleSave() {
    setError(null);
    setSaved(false);
    setSaving(true);
    try {
      const { profile: updated } = await updateOwnProfile(apiClient, {
        display_name: displayName || null,
        bio: bio || null,
        location: location || null,
        country: country || null,
        language,
        avatar_url: avatarUrl,
        tank_photos: tankPhotos,
      });
      setProfile(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save profile");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteAccount() {
    const confirmed = await confirmAsync(
      "Delete your account?",
      "This can't be undone. You'll be signed out immediately.",
      "Delete",
    );
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
          <Pressable
            onPress={() => router.push("/admin")}
            className="flex-row items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-3"
          >
            <ShieldCheck size={16} color={themeColors.foreground} />
            <Text className="text-sm font-semibold text-foreground">Admin</Text>
          </Pressable>
        )}

        <SubscriptionSection />
        <PayoutsSection />
        <SavedSearchesSection />
        <PromoCodeSection />
        <BlockedUsersSection />

        <View>
          <FieldLabel>Avatar</FieldLabel>
          <View className="flex-row items-center gap-4">
            <View className="w-16 h-16 rounded-full overflow-hidden bg-muted items-center justify-center">
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={{ width: 64, height: 64 }} contentFit="cover" />
              ) : (
                <Text className="text-2xl">👤</Text>
              )}
            </View>
            <Pressable onPress={handleAvatarPick} disabled={uploadingAvatar} className="border border-border rounded-xl px-4 py-2.5">
              {uploadingAvatar ? (
                <ActivityIndicator color={themeColors.primary} />
              ) : (
                <Text className="text-sm font-semibold text-foreground">Change Avatar</Text>
              )}
            </Pressable>
          </View>
        </View>

        <View>
          <FieldLabel>Tank Photos</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {tankPhotos.map((url) => (
              <View key={url} className="w-20 h-20 rounded-lg overflow-hidden bg-muted">
                <Image source={{ uri: url }} style={{ width: 80, height: 80 }} contentFit="cover" />
                <Pressable
                  onPress={() => handleRemoveTankPhoto(url)}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/60 items-center justify-center"
                >
                  <X size={12} color={themeColors.white} />
                </Pressable>
              </View>
            ))}
            <Pressable
              onPress={handleAddTankPhoto}
              disabled={uploadingTankPhoto}
              className="w-20 h-20 rounded-lg border border-dashed border-border items-center justify-center"
            >
              {uploadingTankPhoto ? <ActivityIndicator color={themeColors.primary} /> : <Plus size={20} color={themeColors.mutedForeground} />}
            </Pressable>
          </View>
        </View>

        <View>
          <FieldLabel>Display Name</FieldLabel>
          <TextInput value={displayName} onChangeText={setDisplayName} className={inputClassName} placeholderTextColor={themeColors.mutedForeground} />
        </View>

        <View>
          <FieldLabel>Bio</FieldLabel>
          <TextInput
            value={bio}
            onChangeText={setBio}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            className={inputClassName}
            style={{ minHeight: 90 }}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>

        <View className="flex-row gap-4">
          <View className="flex-1">
            <FieldLabel>Location</FieldLabel>
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="City, State"
              className={inputClassName}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
          <View className="flex-1">
            <FieldLabel>Country</FieldLabel>
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="US"
              className={inputClassName}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
        </View>

        <View>
          <FieldLabel>Language</FieldLabel>
          <View className="flex-row flex-wrap gap-2">
            {LANGUAGES.map((lang) => (
              <Pressable
                key={lang.code}
                onPress={() => setLanguage(lang.code)}
                className={`px-3 py-2 rounded-full ${language === lang.code ? "bg-primary" : "bg-muted"}`}
              >
                <Text className={`text-xs font-semibold ${language === lang.code ? "text-primary-foreground" : "text-muted-foreground"}`}>
                  {lang.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {profile && (
          <View className="flex-row items-center gap-3">
            {profile.verified_seller && (
              <View className="bg-emerald-100 rounded-full px-2.5 py-1">
                <Text className="text-xs font-semibold text-emerald-800">✓ Verified Seller</Text>
              </View>
            )}
            <Text className="text-sm text-muted-foreground">{profile.completed_sales_count} completed sales</Text>
          </View>
        )}

        {error && <Text className="text-sm text-destructive">{error}</Text>}
        {saved && <Text className="text-sm text-emerald-600">Saved.</Text>}

        <Pressable onPress={handleSave} disabled={saving || uploadingAvatar} className="bg-primary rounded-xl py-3 items-center">
          {saving ? <ActivityIndicator color={themeColors.white} /> : <Text className="font-semibold text-sm text-white">Save Changes</Text>}
        </Pressable>

        <Text className="text-sm text-muted-foreground mt-2">{session?.user.email}</Text>
        <Pressable onPress={() => supabase.auth.signOut()} className="flex-row items-center justify-center gap-2 bg-muted rounded-xl py-3">
          <LogOut size={16} color={themeColors.foreground} />
          <Text className="font-semibold text-sm text-foreground">Sign Out</Text>
        </Pressable>

        <Pressable testID="delete-account-button" onPress={handleDeleteAccount} disabled={deleting} className="items-center py-2">
          {deleting ? (
            <ActivityIndicator color={themeColors.destructive} />
          ) : (
            <Text className="font-semibold text-sm text-destructive">Delete Account</Text>
          )}
        </Pressable>

        <View className="flex-row justify-center gap-4 pt-2">
          <Pressable onPress={() => router.push("/terms")}>
            <Text className="text-xs text-muted-foreground underline">Terms of Service</Text>
          </Pressable>
          <Pressable onPress={() => router.push("/privacy")}>
            <Text className="text-xs text-muted-foreground underline">Privacy Policy</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
