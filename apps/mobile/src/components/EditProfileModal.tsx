import { updateOwnProfile, LANGUAGES, type LanguageCode, type Profile } from "@reef-market/shared";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera, Plus, X } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { FormField, FormModal, formInputClassName } from "@/components/ui/FormModal";
import { TextInput } from "@/components/ui/TextInput";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { uploadPhotoFromUri } from "@/lib/uploads";

/**
 * Owns its own draft state, seeded from the saved profile each time it
 * opens — Cancel just closes it, so there's no half-edited state left
 * behind on the profile screen. Mounted only while open (see profile.tsx),
 * which is what re-seeds the draft on every open.
 */
export function EditProfileModal({
  profile,
  onClose,
  onSaved,
}: {
  profile: Profile;
  onClose: () => void;
  onSaved: (updated: Profile) => void;
}) {
  const [displayName, setDisplayName] = useState(profile.display_name ?? "");
  const [bio, setBio] = useState(profile.bio ?? "");
  const [location, setLocation] = useState(profile.location ?? "");
  const [country, setCountry] = useState(profile.country ?? "");
  const [language, setLanguage] = useState<LanguageCode>(profile.language);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(profile.avatar_url);
  const [tankPhotos, setTankPhotos] = useState<string[]>(profile.tank_photos);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingTank, setUploadingTank] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function pickImage(): Promise<ImagePicker.ImagePickerAsset | null> {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return null;
    return result.assets[0];
  }

  function extOf(asset: ImagePicker.ImagePickerAsset) {
    return asset.fileName?.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? ".jpg";
  }

  async function handleAvatar() {
    const asset = await pickImage();
    if (!asset) return;
    setUploadingAvatar(true);
    setError(null);
    try {
      setAvatarUrl(await uploadPhotoFromUri("avatars", asset.uri, `avatar${extOf(asset)}`));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingAvatar(false);
    }
  }

  async function handleAddTank() {
    const asset = await pickImage();
    if (!asset) return;
    setUploadingTank(true);
    setError(null);
    try {
      const url = await uploadPhotoFromUri("tank-photos", asset.uri, `tank-${tankPhotos.length + 1}${extOf(asset)}`);
      setTankPhotos((prev) => [...prev, url]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingTank(false);
    }
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const { profile: updated } = await updateOwnProfile(apiClient, {
        display_name: displayName.trim() || null,
        bio: bio.trim() || null,
        location: location.trim() || null,
        country: country.trim() || null,
        language,
        avatar_url: avatarUrl,
        tank_photos: tankPhotos,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save your profile");
      setSaving(false);
    }
  }

  return (
    <FormModal
      visible
      title="Edit profile"
      onClose={onClose}
      onSave={handleSave}
      saving={saving}
      saveDisabled={uploadingAvatar || uploadingTank}
      error={error}
    >
      <View className="items-center gap-2">
        <Pressable onPress={handleAvatar} disabled={uploadingAvatar} className="w-24 h-24 rounded-full overflow-hidden bg-muted items-center justify-center">
          {avatarUrl ? <Image source={{ uri: avatarUrl }} style={{ width: 96, height: 96 }} contentFit="cover" /> : <Text className="text-4xl">👤</Text>}
          <View className="absolute bottom-0 left-0 right-0 h-7 bg-black/50 items-center justify-center">
            {uploadingAvatar ? <ActivityIndicator size="small" color={themeColors.white} /> : <Camera size={14} color={themeColors.white} />}
          </View>
        </Pressable>
        <Text className="text-xs text-muted-foreground">Tap to change photo</Text>
      </View>

      <FormField label="Name">
        <TextInput
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="How buyers will see you"
          placeholderTextColor={themeColors.mutedForeground}
          className={formInputClassName}
        />
      </FormField>

      <FormField label="Bio" hint="A line about your tank or what you keep">
        <TextInput
          value={bio}
          onChangeText={setBio}
          multiline
          textAlignVertical="top"
          placeholder="Reef keeper since 2019, mostly SPS…"
          placeholderTextColor={themeColors.mutedForeground}
          className={formInputClassName}
          style={{ minHeight: 96 }}
        />
      </FormField>

      <View className="flex-row gap-3">
        <View className="flex-1">
          <FormField label="City / State">
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Austin, TX"
              placeholderTextColor={themeColors.mutedForeground}
              className={formInputClassName}
            />
          </FormField>
        </View>
        <View style={{ width: 96 }}>
          <FormField label="Country">
            <TextInput
              value={country}
              onChangeText={setCountry}
              placeholder="US"
              autoCapitalize="characters"
              maxLength={2}
              placeholderTextColor={themeColors.mutedForeground}
              className={formInputClassName}
            />
          </FormField>
        </View>
      </View>

      <FormField label="Tank photos">
        <View className="flex-row flex-wrap gap-2">
          {tankPhotos.map((url) => (
            <View key={url} className="w-20 h-20 rounded-xl overflow-hidden bg-muted">
              <Image source={{ uri: url }} style={{ width: 80, height: 80 }} contentFit="cover" />
              <Pressable
                onPress={() => setTankPhotos((prev) => prev.filter((p) => p !== url))}
                hitSlop={6}
                className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 items-center justify-center"
              >
                <X size={13} color={themeColors.white} />
              </Pressable>
            </View>
          ))}
          <Pressable
            onPress={handleAddTank}
            disabled={uploadingTank}
            className="w-20 h-20 rounded-xl border border-dashed border-border items-center justify-center"
          >
            {uploadingTank ? <ActivityIndicator color={themeColors.primary} /> : <Plus size={22} color={themeColors.mutedForeground} />}
          </Pressable>
        </View>
      </FormField>

      <FormField label="Language">
        <View className="flex-row flex-wrap gap-2">
          {LANGUAGES.map((lang) => (
            <Pressable
              key={lang.code}
              onPress={() => setLanguage(lang.code)}
              className={`px-3.5 py-2 rounded-full ${language === lang.code ? "bg-primary" : "bg-muted"}`}
            >
              <Text className={`text-sm font-semibold ${language === lang.code ? "text-primary-foreground" : "text-muted-foreground"}`}>{lang.label}</Text>
            </Pressable>
          ))}
        </View>
      </FormField>
    </FormModal>
  );
}
