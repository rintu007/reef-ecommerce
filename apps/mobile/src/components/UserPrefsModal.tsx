import { COUNTRIES, LANGUAGES, useT, type LanguageCode } from "@reef-market/shared";
import { useState } from "react";
import { Modal, Pressable, ScrollView, Text, View } from "react-native";
import { useLanguagePrefs } from "@/lib/language-context";

/** Legacy parity: legacy/vite-app/src/components/UserPrefsModal.jsx. */
export function UserPrefsModal() {
  const { lang: detectedLang, country: detectedCountry, showModal, savePrefs, dismissModal } = useLanguagePrefs();
  const [lang, setLang] = useState<LanguageCode>(detectedLang);
  const [country, setCountry] = useState(detectedCountry);
  const t = useT(lang);

  if (!showModal) return null;

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent>
      <View className="flex-1 bg-black/60 items-center justify-center p-4">
        <View className="bg-white w-full max-w-md rounded-2xl overflow-hidden" style={{ maxHeight: "85%" }}>
          <View className="bg-primary px-6 pt-8 pb-6 items-center">
            <View className="w-14 h-14 rounded-2xl bg-white/20 items-center justify-center mb-3">
              <Text className="text-2xl">🪸</Text>
            </View>
            <Text className="text-xl font-bold text-white text-center">{t("prefs_title")}</Text>
            <Text className="text-white/80 text-sm mt-1 text-center">{t("prefs_subtitle")}</Text>
          </View>

          <ScrollView contentContainerStyle={{ padding: 24, gap: 20 }}>
            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-900">{t("choose_language")}</Text>
              <View className="flex-row flex-wrap gap-2">
                {LANGUAGES.map((l) => (
                  <Pressable
                    key={l.code}
                    onPress={() => setLang(l.code)}
                    className={`py-2.5 px-3 rounded-xl border ${lang === l.code ? "border-primary bg-primary/10" : "border-gray-200 bg-white"}`}
                    style={{ width: "47%" }}
                  >
                    <Text className={`text-sm font-medium ${lang === l.code ? "text-primary" : "text-gray-700"}`}>{l.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View className="gap-2">
              <Text className="text-sm font-semibold text-gray-900">{t("choose_country")}</Text>
              <Text className="text-xs text-gray-500">{t("prefs_country_note")}</Text>
              <View className="border border-gray-200 rounded-xl" style={{ maxHeight: 160 }}>
                <ScrollView nestedScrollEnabled>
                  {COUNTRIES.map((c, i) => (
                    <Pressable
                      key={c.code}
                      onPress={() => setCountry(c.code)}
                      className={`px-3 py-2.5 ${i === COUNTRIES.length - 1 ? "" : "border-b border-gray-100"} ${
                        country === c.code ? "bg-primary/10" : ""
                      }`}
                    >
                      <Text className={`text-sm ${country === c.code ? "text-primary font-semibold" : "text-gray-700"}`}>{c.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            </View>

            <Pressable onPress={() => savePrefs(lang, country)} className="h-12 rounded-xl items-center justify-center bg-primary">
              <Text className="font-bold text-sm text-white">{t("get_started")}</Text>
            </Pressable>

            <Pressable onPress={dismissModal}>
              <Text className="text-center text-xs text-gray-400 underline">Skip for now</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
