import type { ReactNode } from "react";
import { ActivityIndicator, Modal, Pressable, Text, View } from "react-native";
import { KeyboardAwareScrollView } from "react-native-keyboard-controller";
import { SafeAreaView } from "react-native-safe-area-context";
import { themeColors } from "@/lib/theme-colors";

/**
 * Shared shell for every quick edit/create flow in the app: slides up over
 * the current screen, Cancel on the left, Save on the right (with its own
 * spinner, so a tap visibly registers), and a keyboard-aware body so the
 * focused field is never hidden behind the keyboard or the nav bar.
 */
export function FormModal({
  visible,
  title,
  onClose,
  onSave,
  saving = false,
  saveLabel = "Save",
  saveDisabled = false,
  error,
  children,
}: {
  visible: boolean;
  title: string;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  saveLabel?: string;
  saveDisabled?: boolean;
  error?: string | null;
  children: ReactNode;
}) {
  const disabled = saving || saveDisabled;

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <SafeAreaView edges={["top", "bottom"]} className="flex-1 bg-background">
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-border">
          <Pressable onPress={onClose} disabled={saving} hitSlop={10} className="min-w-[64px]">
            <Text className="text-base text-muted-foreground">Cancel</Text>
          </Pressable>
          <Text className="text-base font-bold text-foreground">{title}</Text>
          <Pressable
            onPress={onSave}
            disabled={disabled}
            hitSlop={10}
            className={`min-w-[64px] items-center rounded-full px-4 py-1.5 ${disabled ? "bg-muted" : "bg-primary"}`}
          >
            {saving ? (
              <ActivityIndicator size="small" color={themeColors.white} />
            ) : (
              <Text className={`text-sm font-bold ${disabled ? "text-muted-foreground" : "text-white"}`}>{saveLabel}</Text>
            )}
          </Pressable>
        </View>

        <KeyboardAwareScrollView bottomOffset={24} keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 20, gap: 18, paddingBottom: 40 }}>
          {error && (
            <View className="rounded-xl bg-destructive/10 px-3 py-2.5">
              <Text className="text-sm text-destructive">{error}</Text>
            </View>
          )}
          {children}
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </Modal>
  );
}

export function FormField({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-foreground">{label}</Text>
      {children}
      {hint && <Text className="text-xs text-muted-foreground">{hint}</Text>}
    </View>
  );
}

export const formInputClassName = "border border-border bg-card rounded-xl px-3.5 py-3 text-base text-foreground";
