import AsyncStorage from "@react-native-async-storage/async-storage";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectCountry, detectLanguage, getOwnProfile, updateOwnProfile, type LanguageCode } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const PREFS_SET_KEY = "reef_prefs_set";
const LANG_KEY = "reef_lang";
const COUNTRY_KEY = "reef_country";

interface LanguageContextValue {
  lang: LanguageCode;
  country: string;
  /** null while still determining on first mount — avoids flashing the modal for returning users, same pattern as EULAGate. */
  showModal: boolean | null;
  savePrefs: (lang: LanguageCode, country: string) => void;
  dismissModal: () => void;
  /** Reopens the picker later — e.g. Profile's "Language & Country" row (legacy's "edit_preferences"). */
  openModal: () => void;
}

const LanguageContext = createContext<LanguageContextValue>({
  lang: "en",
  country: "US",
  showModal: false,
  savePrefs: () => {},
  dismissModal: () => {},
  openModal: () => {},
});

/**
 * Legacy parity: legacy/vite-app's UserPrefsContext + UserPrefsModal. This
 * infra (translations, detectCountry/detectLanguage) already existed in
 * packages/shared but was never actually wired to anything — no language
 * switcher, no first-run modal, every screen hardcoded English. Same
 * AsyncStorage-first / profile-sync-for-signed-in-users pattern as EULAGate.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const { session, loading: authLoading } = useAuth();
  const [lang, setLang] = useState<LanguageCode>("en");
  const [country, setCountry] = useState("US");
  const [showModal, setShowModal] = useState<boolean | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;

    async function init() {
      const storedSet = await AsyncStorage.getItem(PREFS_SET_KEY);
      if (storedSet) {
        const [storedLang, storedCountry] = await Promise.all([AsyncStorage.getItem(LANG_KEY), AsyncStorage.getItem(COUNTRY_KEY)]);
        if (!cancelled) {
          setLang((storedLang as LanguageCode) || "en");
          setCountry(storedCountry || "US");
          setShowModal(false);
        }
        return;
      }

      if (session) {
        try {
          const { profile } = await getOwnProfile(apiClient);
          if (profile.language || profile.country) {
            await AsyncStorage.setItem(PREFS_SET_KEY, "1");
            await AsyncStorage.setItem(LANG_KEY, profile.language);
            if (profile.country) await AsyncStorage.setItem(COUNTRY_KEY, profile.country);
            if (!cancelled) {
              setLang(profile.language);
              setCountry(profile.country || "US");
              setShowModal(false);
            }
            return;
          }
        } catch {
          // fall through to first-run detection
        }
      }

      if (!cancelled) {
        setLang(detectLanguage() as LanguageCode);
        setCountry(detectCountry());
        setShowModal(true);
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [authLoading, session]);

  function savePrefs(newLang: LanguageCode, newCountry: string) {
    AsyncStorage.setItem(PREFS_SET_KEY, "1");
    AsyncStorage.setItem(LANG_KEY, newLang);
    AsyncStorage.setItem(COUNTRY_KEY, newCountry);
    setLang(newLang);
    setCountry(newCountry);
    setShowModal(false);

    if (session) updateOwnProfile(apiClient, { language: newLang, country: newCountry }).catch(() => {});
  }

  function dismissModal() {
    AsyncStorage.setItem(PREFS_SET_KEY, "1");
    AsyncStorage.setItem(LANG_KEY, lang);
    AsyncStorage.setItem(COUNTRY_KEY, country);
    setShowModal(false);
  }

  return (
    <LanguageContext.Provider value={{ lang, country, showModal, savePrefs, dismissModal, openModal: () => setShowModal(true) }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguagePrefs() {
  return useContext(LanguageContext);
}
