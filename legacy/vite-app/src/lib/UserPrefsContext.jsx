import { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { safeStorage } from "@/lib/safe-storage";
import { getT } from "@/lib/i18n";

const PREFS_KEY = "reef_user_prefs_v1";

const UserPrefsContext = createContext(null);

export function UserPrefsProvider({ children }) {
  const [language, setLanguageState] = useState(() => safeStorage.getItem(PREFS_KEY + "_lang") || "en");
  const [country, setCountryState] = useState(() => safeStorage.getItem(PREFS_KEY + "_country") || "");
  const [showPrefsModal, setShowPrefsModal] = useState(false);

  // On mount: check if prefs are set. If not, show modal.
  useEffect(() => {
    const hasCountry = !!safeStorage.getItem(PREFS_KEY + "_country");
    if (!hasCountry) {
      setShowPrefsModal(true);
    }
  }, []);

  // Sync from user profile when authenticated
  useEffect(() => {
    base44.auth.me().then((user) => {
      if (user?.language) {
        setLanguageState(user.language);
        safeStorage.setItem(PREFS_KEY + "_lang", user.language);
      }
      if (user?.country) {
        setCountryState(user.country);
        safeStorage.setItem(PREFS_KEY + "_country", user.country);
        setShowPrefsModal(false);
      }
    }).catch(() => {});
  }, []);

  const savePrefs = useCallback(async (lang, cnt) => {
    setLanguageState(lang);
    setCountryState(cnt);
    safeStorage.setItem(PREFS_KEY + "_lang", lang);
    safeStorage.setItem(PREFS_KEY + "_country", cnt);
    setShowPrefsModal(false);
    // Persist to profile if logged in
    base44.auth.updateMe({ language: lang, country: cnt }).catch(() => {});
  }, []);

  const t = useMemo(() => getT(language), [language]);

  return (
    <UserPrefsContext.Provider value={{ language, country, showPrefsModal, setShowPrefsModal, savePrefs, t }}>
      {children}
    </UserPrefsContext.Provider>
  );
}

export function useUserPrefs() {
  const ctx = useContext(UserPrefsContext);
  if (!ctx) throw new Error("useUserPrefs must be used within UserPrefsProvider");
  return ctx;
}