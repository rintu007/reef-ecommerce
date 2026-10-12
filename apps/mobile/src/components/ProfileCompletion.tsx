import type { Profile } from "@reef-market/shared";
import { Check, ChevronDown, ChevronUp, Circle } from "lucide-react-native";
import { useState } from "react";
import { Pressable, Text, View } from "react-native";
import { themeColors } from "@/lib/theme-colors";

interface Item {
  key: string;
  label: string;
  hint: string;
  done: boolean;
  action: "edit" | "payouts";
}

export function profileCompletionItems(profile: Profile | null, payoutsEnabled: boolean): Item[] {
  return [
    { key: "name", label: "Your name", hint: "So buyers and sellers know who they're dealing with", done: !!profile?.display_name, action: "edit" },
    { key: "photo", label: "Profile photo", hint: "Profiles with a photo get noticeably more trust", done: !!profile?.avatar_url, action: "edit" },
    { key: "bio", label: "Short bio", hint: "A line about your tank or what you keep", done: !!profile?.bio, action: "edit" },
    { key: "location", label: "Location", hint: "Needed for local-pickup buyers to find you", done: !!profile?.location, action: "edit" },
    { key: "tank", label: "Tank photo", hint: "Show off your setup", done: (profile?.tank_photos?.length ?? 0) > 0, action: "edit" },
    { key: "payouts", label: "Stripe payouts", hint: "Required to sell — it's how you get paid", done: payoutsEnabled, action: "payouts" },
  ];
}

/**
 * Tap the bar to see exactly what's missing; each missing item jumps
 * straight to where you'd fix it (the edit form, or Stripe setup) instead
 * of just telling you a number.
 */
export function ProfileCompletion({
  profile,
  payoutsEnabled,
  onEdit,
  onConnectPayouts,
}: {
  profile: Profile | null;
  payoutsEnabled: boolean;
  onEdit: () => void;
  onConnectPayouts: () => void;
}) {
  const [open, setOpen] = useState(false);
  const items = profileCompletionItems(profile, payoutsEnabled);
  const doneCount = items.filter((i) => i.done).length;
  const percent = Math.round((doneCount / items.length) * 100);
  const missing = items.filter((i) => !i.done);

  return (
    <View className="mt-4 pt-4 border-t border-border">
      <Pressable onPress={() => setOpen((o) => !o)} disabled={missing.length === 0} className="gap-2">
        <View className="flex-row items-center justify-between">
          <Text className="text-sm font-semibold text-foreground">
            {percent === 100 ? "Profile complete 🎉" : `Profile ${percent}% complete`}
          </Text>
          {missing.length > 0 && (
            <View className="flex-row items-center gap-1">
              <Text className="text-xs font-semibold text-primary">{missing.length} to go</Text>
              {open ? <ChevronUp size={14} color={themeColors.primary} /> : <ChevronDown size={14} color={themeColors.primary} />}
            </View>
          )}
        </View>
        <View className="h-2 rounded-full bg-muted overflow-hidden">
          <View
            className="h-2 rounded-full"
            style={{ width: `${percent}%`, backgroundColor: percent === 100 ? "#059669" : themeColors.primary }}
          />
        </View>
      </Pressable>

      {open && missing.length > 0 && (
        <View className="mt-3 gap-1">
          {items.map((item) => (
            <Pressable
              key={item.key}
              disabled={item.done}
              onPress={() => {
                setOpen(false);
                if (item.action === "payouts") onConnectPayouts();
                else onEdit();
              }}
              className="flex-row items-center gap-3 py-2"
            >
              {item.done ? <Check size={16} color="#059669" /> : <Circle size={16} color={themeColors.mutedForeground} />}
              <View className="flex-1">
                <Text className={`text-sm ${item.done ? "text-muted-foreground line-through" : "font-semibold text-foreground"}`}>{item.label}</Text>
                {!item.done && <Text className="text-xs text-muted-foreground">{item.hint}</Text>}
              </View>
              {!item.done && <Text className="text-xs font-semibold text-primary">{item.action === "payouts" ? "Connect" : "Add"}</Text>}
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}
