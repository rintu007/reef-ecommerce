import {
  createAnnouncement,
  deleteAnnouncement,
  listAdminAnnouncements,
  updateAnnouncement,
  type Announcement,
} from "@reef-market/shared";
import { Stack, useRouter } from "expo-router";
import { ArrowLeft } from "lucide-react-native";
import { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Switch, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { AdminGate } from "@/components/AdminGate";
import { confirmAsync, notify } from "@/lib/alert";
import { apiClient } from "@/lib/api-client";
import { themeColors } from "@/lib/theme-colors";

const inputClassName = "border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground";

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-sm font-medium text-muted-foreground mb-1">{children}</Text>;
}

// Mirrors apps/web/src/app/admin/announcements/AdminAnnouncementsTable.tsx, plus a
// full edit form (the web table only exposes an active/inactive toggle + delete —
// added inline editing here since updateAnnouncement already accepts every field).
function AdminAnnouncementsContent() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [maxViews, setMaxViews] = useState("1");
  const [showToGuests, setShowToGuests] = useState(false);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { announcements } = await listAdminAnnouncements(apiClient, { limit: 100 });
      setAnnouncements(announcements);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to load announcements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(load, 0);
    return () => clearTimeout(timer);
  }, [load]);

  function resetForm() {
    setEditingId(null);
    setSubject("");
    setMessage("");
    setMaxViews("1");
    setShowToGuests(false);
    setIsActive(true);
    setError(null);
  }

  function startEdit(a: Announcement) {
    setEditingId(a.id);
    setSubject(a.subject);
    setMessage(a.message);
    setMaxViews(String(a.max_views));
    setShowToGuests(a.show_to_guests);
    setIsActive(a.is_active);
    setError(null);
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      if (editingId) {
        await updateAnnouncement(apiClient, editingId, {
          subject,
          message,
          max_views: Number(maxViews) || 1,
          show_to_guests: showToGuests,
          is_active: isActive,
        });
      } else {
        await createAnnouncement(apiClient, {
          subject,
          message,
          max_views: Number(maxViews) || 1,
          show_to_guests: showToGuests,
          is_active: true,
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingId ? "save" : "create"} announcement`);
    } finally {
      setSubmitting(false);
    }
  }

  async function toggleActive(a: Announcement) {
    setBusyId(a.id);
    try {
      await updateAnnouncement(apiClient, a.id, { is_active: !a.is_active });
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to update announcement");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirmAsync("Delete announcement?", "This can't be undone.", "Delete");
    if (!confirmed) return;
    setBusyId(id);
    try {
      await deleteAnnouncement(apiClient, id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to delete announcement");
    } finally {
      setBusyId(null);
    }
  }

  const canSubmit = !submitting && subject.trim().length > 0 && message.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <View className="rounded-xl border border-border bg-card p-4 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-sm text-foreground">{editingId ? "Edit Announcement" : "New Announcement"}</Text>
          {editingId && (
            <Pressable onPress={resetForm}>
              <Text className="text-xs font-semibold text-primary">Cancel</Text>
            </Pressable>
          )}
        </View>

        <View>
          <FieldLabel>Subject</FieldLabel>
          <TextInput
            testID="announcement-subject-input"
            value={subject}
            onChangeText={setSubject}
            placeholder="Subject"
            className={inputClassName}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>

        <View>
          <FieldLabel>Message</FieldLabel>
          <TextInput
            testID="announcement-message-input"
            value={message}
            onChangeText={setMessage}
            placeholder="Message"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            className={inputClassName}
            style={{ minHeight: 70 }}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>

        <View>
          <FieldLabel>Max views per user</FieldLabel>
          <TextInput
            testID="announcement-maxviews-input"
            value={maxViews}
            onChangeText={setMaxViews}
            keyboardType="number-pad"
            className={inputClassName}
            style={{ width: 80 }}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>

        <View className="flex-row items-center justify-between">
          <Text className="text-sm text-foreground flex-1 pr-3">Show to guests</Text>
          <Switch value={showToGuests} onValueChange={setShowToGuests} trackColor={{ true: themeColors.primary, false: undefined }} />
        </View>

        {editingId && (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground flex-1 pr-3">Active</Text>
            <Switch value={isActive} onValueChange={setIsActive} trackColor={{ true: themeColors.primary, false: undefined }} />
          </View>
        )}

        {error && <Text className="text-sm text-destructive">{error}</Text>}

        <Pressable
          testID="announcement-submit-button"
          onPress={handleSubmit}
          disabled={!canSubmit}
          className={`rounded-xl py-3 items-center ${canSubmit ? "bg-primary" : "bg-muted"}`}
        >
          {submitting ? (
            <ActivityIndicator color={themeColors.white} />
          ) : (
            <Text className={`font-semibold text-sm ${canSubmit ? "text-white" : "text-muted-foreground"}`}>
              {editingId ? "Save Changes" : "Create"}
            </Text>
          )}
        </Pressable>
      </View>

      {loading ? (
        <View className="items-center py-16">
          <ActivityIndicator color={themeColors.primary} />
        </View>
      ) : announcements.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No announcements yet.</Text>
      ) : (
        <View className="gap-2">
          {announcements.map((a) => {
            const busy = busyId === a.id;
            return (
              <View key={a.id} className="rounded-xl border border-border bg-card p-3 gap-2">
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {a.subject}{" "}
                    <Text className={`text-xs font-normal ${a.is_active ? "text-primary" : "text-muted-foreground"}`}>
                      {a.is_active ? "active" : "inactive"}
                    </Text>
                  </Text>
                  <Text className="text-sm text-muted-foreground mt-1">{a.message}</Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    max {a.max_views} view{a.max_views === 1 ? "" : "s"} · {a.show_to_guests ? "guests + members" : "members only"}
                  </Text>
                </View>
                <View className="flex-row gap-4">
                  <Pressable disabled={busy} onPress={() => startEdit(a)}>
                    <Text className="text-sm font-semibold text-primary" style={busy ? { opacity: 0.5 } : undefined}>
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable disabled={busy} onPress={() => toggleActive(a)}>
                    <Text className="text-sm font-semibold text-primary" style={busy ? { opacity: 0.5 } : undefined}>
                      {a.is_active ? "Deactivate" : "Activate"}
                    </Text>
                  </Pressable>
                  <Pressable disabled={busy} onPress={() => handleDelete(a.id)}>
                    <Text className="text-sm font-semibold text-destructive" style={busy ? { opacity: 0.5 } : undefined}>
                      Delete
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

export default function AdminAnnouncementsScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => router.back()} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Announcements</Text>
        </View>
        <AdminAnnouncementsContent />
      </SafeAreaView>
    </AdminGate>
  );
}
