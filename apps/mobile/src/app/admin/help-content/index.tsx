import {
  createHelpContent,
  deleteHelpContent,
  listAdminHelpContent,
  updateHelpContent,
  HELP_CATEGORIES,
  type HelpCategory,
  type HelpContent,
  type HelpContentType,
  type MarketType,
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
import { safeGoBack } from "@/lib/navigation";

const CONTENT_TYPES: HelpContentType[] = ["article", "video", "tip", "faq"];
const MARKETS: { value: MarketType; label: string }[] = [
  { value: "both", label: "Both" },
  { value: "saltwater", label: "Saltwater" },
  { value: "freshwater", label: "Freshwater" },
];

const inputClassName = "border border-border bg-card rounded-xl px-3 py-2.5 text-sm text-foreground";

function FieldLabel({ children }: { children: string }) {
  return <Text className="text-sm font-medium text-muted-foreground mb-1">{children}</Text>;
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} className={`px-3 py-2 rounded-full ${active ? "bg-primary" : "bg-muted"}`}>
      <Text className={`text-xs font-semibold ${active ? "text-primary-foreground" : "text-muted-foreground"}`}>{label}</Text>
    </Pressable>
  );
}

// Mirrors apps/web/src/app/admin/help-content/AdminHelpContentTable.tsx, plus a full
// edit form (the web table only exposes a published/draft toggle + delete — added
// inline editing here since updateHelpContent already accepts every field). This is
// the content that feeds apps/mobile/src/app/learn.tsx's category browser.
function AdminHelpContentContent() {
  const [items, setItems] = useState<HelpContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<HelpCategory>(HELP_CATEGORIES[0].value);
  const [categories, setCategories] = useState<HelpCategory[]>([]);
  const [contentType, setContentType] = useState<HelpContentType>("article");
  const [market, setMarket] = useState<MarketType>("both");
  const [body, setBody] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [published, setPublished] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { items } = await listAdminHelpContent(apiClient, { limit: 200 });
      setItems(items);
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to load Learn content");
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
    setTitle("");
    setCategory(HELP_CATEGORIES[0].value);
    setCategories([]);
    setContentType("article");
    setMarket("both");
    setBody("");
    setYoutubeUrl("");
    setPublished(true);
    setError(null);
  }

  function startEdit(item: HelpContent) {
    setEditingId(item.id);
    setTitle(item.title);
    setCategory(item.category);
    setCategories(item.categories as HelpCategory[]);
    setContentType(item.content_type);
    setMarket(item.market);
    setBody(item.body ?? "");
    setYoutubeUrl(item.youtube_url ?? "");
    setPublished(item.published);
    setError(null);
  }

  function toggleExtraCategory(value: HelpCategory) {
    setCategories((prev) => (prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]));
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    const extraCategories = categories.filter((c) => c !== category);
    try {
      if (editingId) {
        await updateHelpContent(apiClient, editingId, {
          title,
          category,
          categories: extraCategories,
          content_type: contentType,
          market,
          body: contentType === "video" ? null : body || null,
          youtube_url: contentType === "video" ? youtubeUrl || null : null,
          published,
        });
      } else {
        await createHelpContent(apiClient, {
          title,
          category,
          categories: extraCategories,
          content_type: contentType,
          market,
          body: contentType === "video" ? null : body || null,
          youtube_url: contentType === "video" ? youtubeUrl || null : null,
          published: true,
        });
      }
      resetForm();
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : `Failed to ${editingId ? "save" : "create"}`);
    } finally {
      setSubmitting(false);
    }
  }

  async function togglePublished(item: HelpContent) {
    setBusyId(item.id);
    try {
      await updateHelpContent(apiClient, item.id, { published: !item.published });
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to update item");
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(id: string) {
    const confirmed = await confirmAsync("Delete this Learn item?", "This can't be undone.", "Delete");
    if (!confirmed) return;
    setBusyId(id);
    try {
      await deleteHelpContent(apiClient, id);
      if (editingId === id) resetForm();
      await load();
    } catch (err) {
      notify("Error", err instanceof Error ? err.message : "Failed to delete item");
    } finally {
      setBusyId(null);
    }
  }

  const canSubmit = !submitting && title.trim().length > 0;

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}>
      <View className="rounded-xl border border-border bg-card p-4 gap-3">
        <View className="flex-row items-center justify-between">
          <Text className="font-semibold text-sm text-foreground">{editingId ? "Edit Learn Item" : "New Learn Item"}</Text>
          {editingId && (
            <Pressable onPress={resetForm}>
              <Text className="text-xs font-semibold text-primary">Cancel</Text>
            </Pressable>
          )}
        </View>

        <View>
          <FieldLabel>Title</FieldLabel>
          <TextInput
            testID="help-content-title-input"
            value={title}
            onChangeText={setTitle}
            placeholder="Title"
            className={inputClassName}
            placeholderTextColor={themeColors.mutedForeground}
          />
        </View>

        <View>
          <FieldLabel>Category</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {HELP_CATEGORIES.map((c) => (
              <Chip key={c.value} label={`${c.icon} ${c.label}`} active={category === c.value} onPress={() => setCategory(c.value)} />
            ))}
          </ScrollView>
        </View>

        <View>
          <FieldLabel>Also show under (optional)</FieldLabel>
          <View className="flex-row flex-wrap gap-1.5">
            {HELP_CATEGORIES.filter((c) => c.value !== category).map((c) => (
              <Chip key={c.value} label={`${c.icon} ${c.label}`} active={categories.includes(c.value)} onPress={() => toggleExtraCategory(c.value)} />
            ))}
          </View>
        </View>

        <View>
          <FieldLabel>Market</FieldLabel>
          <View className="flex-row gap-2">
            {MARKETS.map((m) => (
              <Chip key={m.value} label={m.label} active={market === m.value} onPress={() => setMarket(m.value)} />
            ))}
          </View>
        </View>

        <View>
          <FieldLabel>Content type</FieldLabel>
          <View className="flex-row gap-2">
            {CONTENT_TYPES.map((t) => (
              <Chip key={t} label={t} active={contentType === t} onPress={() => setContentType(t)} />
            ))}
          </View>
        </View>

        {contentType === "video" ? (
          <View>
            <FieldLabel>YouTube URL</FieldLabel>
            <TextInput
              testID="help-content-youtube-input"
              value={youtubeUrl}
              onChangeText={setYoutubeUrl}
              placeholder="https://youtube.com/watch?v=..."
              autoCapitalize="none"
              className={inputClassName}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
        ) : (
          <View>
            <FieldLabel>Body text</FieldLabel>
            <TextInput
              testID="help-content-body-input"
              value={body}
              onChangeText={setBody}
              placeholder="Body text"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              className={inputClassName}
              style={{ minHeight: 90 }}
              placeholderTextColor={themeColors.mutedForeground}
            />
          </View>
        )}

        {editingId && (
          <View className="flex-row items-center justify-between">
            <Text className="text-sm text-foreground flex-1 pr-3">Published</Text>
            <Switch value={published} onValueChange={setPublished} trackColor={{ true: themeColors.primary, false: undefined }} />
          </View>
        )}

        {error && <Text className="text-sm text-destructive">{error}</Text>}

        <Pressable
          testID="help-content-submit-button"
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
      ) : items.length === 0 ? (
        <Text className="text-sm text-muted-foreground text-center py-8">No Learn content yet.</Text>
      ) : (
        <View className="gap-2">
          {items.map((item) => {
            const busy = busyId === item.id;
            return (
              <View key={item.id} className="rounded-xl border border-border bg-card p-3 gap-2">
                <View>
                  <Text className="text-sm font-semibold text-foreground">
                    {item.title}{" "}
                    <Text className={`text-xs font-normal ${item.published ? "text-primary" : "text-muted-foreground"}`}>
                      {item.published ? "published" : "draft"}
                    </Text>
                  </Text>
                  <Text className="text-xs text-muted-foreground mt-1">
                    {HELP_CATEGORIES.find((c) => c.value === item.category)?.label}
                    {item.categories.length > 0 && ` +${item.categories.length} more`} · {item.content_type} · {item.market}
                  </Text>
                  {item.body && (
                    <Text className="text-sm text-muted-foreground mt-1" numberOfLines={2}>
                      {item.body}
                    </Text>
                  )}
                </View>
                <View className="flex-row gap-4">
                  <Pressable disabled={busy} onPress={() => startEdit(item)}>
                    <Text className="text-sm font-semibold text-primary" style={busy ? { opacity: 0.5 } : undefined}>
                      Edit
                    </Text>
                  </Pressable>
                  <Pressable disabled={busy} onPress={() => togglePublished(item)}>
                    <Text className="text-sm font-semibold text-primary" style={busy ? { opacity: 0.5 } : undefined}>
                      {item.published ? "Unpublish" : "Publish"}
                    </Text>
                  </Pressable>
                  <Pressable disabled={busy} onPress={() => handleDelete(item.id)}>
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

export default function AdminHelpContentScreen() {
  const router = useRouter();
  return (
    <AdminGate>
      <SafeAreaView edges={["top"]} className="flex-1 bg-background">
        <Stack.Screen options={{ headerShown: false }} />
        <View className="flex-row items-center gap-3 px-4 pt-2 pb-3 border-b border-border">
          <Pressable onPress={() => safeGoBack(router)} className="w-9 h-9 items-center justify-center -ml-2">
            <ArrowLeft size={20} color={themeColors.foreground} />
          </Pressable>
          <Text className="text-base font-semibold text-foreground">Learn Content</Text>
        </View>
        <AdminHelpContentContent />
      </SafeAreaView>
    </AdminGate>
  );
}
