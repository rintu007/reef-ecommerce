import { updateListing, type Listing } from "@reef-market/shared";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { Camera } from "lucide-react-native";
import { useEffect, useState } from "react";
import { ActivityIndicator, Modal, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";
import { uploadPhotoFromUri } from "@/lib/uploads";

const inputClassName = "border border-border bg-background rounded-xl px-3 py-2.5 text-sm text-foreground";

/**
 * Mobile counterpart to web's inline Quick Edit row: RN list rows can't grow
 * in place as gracefully, so this reuses the bottom-sheet Modal convention
 * already established by ReportBlockSheet.tsx. Edits exactly the same 5
 * fields as legacy: title, price, quantity, description, and photos[0] only
 * (swapped via the small camera-icon overlay, uploaded immediately, but only
 * persisted to the listing along with the other fields on explicit Save).
 */
export function QuickEditListingSheet({
  visible,
  listing,
  onClose,
  onSaved,
}: {
  visible: boolean;
  listing: Listing | null;
  onClose: () => void;
  onSaved: (updated: Listing) => void;
}) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState("");
  const [description, setDescription] = useState("");
  const [pendingPhoto, setPendingPhoto] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form to the current listing's values every time the sheet opens.
  useEffect(() => {
    if (!visible || !listing) return;
    const timer = setTimeout(() => {
      setTitle(listing.title);
      setPrice(String(listing.price));
      setQuantity(String(listing.quantity));
      setDescription(listing.description ?? "");
      setPendingPhoto(null);
      setError(null);
    }, 0);
    return () => clearTimeout(timer);
  }, [visible, listing]);

  async function handlePickPhoto() {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], quality: 0.8 });
    if (result.canceled || result.assets.length === 0) return;

    setUploadingPhoto(true);
    setError(null);
    try {
      const asset = result.assets[0];
      const ext = asset.fileName?.match(/\.[a-zA-Z0-9]{1,8}$/)?.[0] ?? ".jpg";
      const url = await uploadPhotoFromUri("listing-photos", asset.uri, `photo${ext}`);
      setPendingPhoto(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Photo upload failed");
    } finally {
      setUploadingPhoto(false);
    }
  }

  async function handleSave() {
    if (!listing) return;
    setSaving(true);
    setError(null);
    try {
      const photos = pendingPhoto ? [pendingPhoto, ...listing.photos.slice(1)] : listing.photos;
      const { listing: updated } = await updateListing(apiClient, listing.id, {
        title,
        price: Number(price) || 0,
        quantity: Number(quantity) || 0,
        description: description || undefined,
        photos,
      });
      onSaved(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  if (!listing) return null;
  const photoUrl = pendingPhoto ?? listing.photos[0];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 bg-black/40" onPress={onClose}>
        <Pressable className="mt-auto bg-card rounded-t-2xl p-4 gap-3" onPress={(e) => e.stopPropagation()}>
          <Text className="text-base font-semibold text-foreground">Quick Edit</Text>

          <ScrollView contentContainerStyle={{ gap: 12 }} style={{ maxHeight: 420 }}>
            <View className="items-center">
              <View className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted">
                {photoUrl && <Image source={{ uri: photoUrl }} style={{ width: 80, height: 80 }} contentFit="cover" />}
                <Pressable
                  testID="quick-edit-photo-button"
                  onPress={handlePickPhoto}
                  disabled={uploadingPhoto}
                  className="absolute bottom-0.5 right-0.5 w-7 h-7 rounded-full bg-black/70 items-center justify-center"
                >
                  {uploadingPhoto ? <ActivityIndicator size="small" color={themeColors.white} /> : <Camera size={14} color={themeColors.white} />}
                </Pressable>
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-muted-foreground mb-1">Title</Text>
              <TextInput
                testID="quick-edit-title"
                value={title}
                onChangeText={setTitle}
                placeholderTextColor={themeColors.mutedForeground}
                className={inputClassName}
              />
            </View>

            <View className="flex-row gap-3">
              <View className="flex-1">
                <Text className="text-sm font-medium text-muted-foreground mb-1">Price ($)</Text>
                <TextInput
                  testID="quick-edit-price"
                  value={price}
                  onChangeText={setPrice}
                  keyboardType="decimal-pad"
                  placeholderTextColor={themeColors.mutedForeground}
                  className={inputClassName}
                />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-medium text-muted-foreground mb-1">Quantity</Text>
                <TextInput
                  testID="quick-edit-quantity"
                  value={quantity}
                  onChangeText={setQuantity}
                  keyboardType="number-pad"
                  placeholderTextColor={themeColors.mutedForeground}
                  className={inputClassName}
                />
              </View>
            </View>

            <View>
              <Text className="text-sm font-medium text-muted-foreground mb-1">Description</Text>
              <TextInput
                testID="quick-edit-description"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                style={{ minHeight: 90 }}
                placeholderTextColor={themeColors.mutedForeground}
                className={inputClassName}
              />
            </View>

            {error && <Text className="text-sm text-destructive">{error}</Text>}
          </ScrollView>

          <View className="flex-row gap-3 pt-1">
            <Pressable onPress={onClose} disabled={saving} className="flex-1 bg-muted rounded-xl py-3 items-center">
              <Text className="text-sm font-semibold text-foreground">Cancel</Text>
            </Pressable>
            <Pressable
              testID="quick-edit-save"
              onPress={handleSave}
              disabled={saving || uploadingPhoto}
              className="flex-1 bg-primary rounded-xl py-3 items-center"
            >
              {saving ? <ActivityIndicator color={themeColors.white} /> : <Text className="text-sm font-semibold text-white">Save</Text>}
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
