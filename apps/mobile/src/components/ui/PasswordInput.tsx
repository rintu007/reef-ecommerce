import { useState } from "react";
import { Eye, EyeOff } from "lucide-react-native";
import { Pressable, View, type TextInputProps } from "react-native";
import { TextInput } from "@/components/ui/TextInput";
import { themeColors } from "@/lib/theme-colors";

/** A password TextInput with a show/hide eye toggle, since there's no way to proofread a typo'd password otherwise. */
export function PasswordInput({ className, ...props }: TextInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <View className="relative justify-center">
      <TextInput {...props} secureTextEntry={!visible} className={`pr-11 ${className ?? ""}`} />
      <Pressable
        onPress={() => setVisible((v) => !v)}
        hitSlop={8}
        className="absolute right-3 items-center justify-center"
      >
        {visible ? (
          <EyeOff size={18} color={themeColors.mutedForeground} />
        ) : (
          <Eye size={18} color={themeColors.mutedForeground} />
        )}
      </Pressable>
    </View>
  );
}
