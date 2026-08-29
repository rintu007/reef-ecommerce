"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { detectCountry, detectLanguage, getOwnProfile, updateOwnProfile, type LanguageCode } from "@reef-market/shared";
import { apiClient } from "@/lib/api-client";
import { createSupabaseBrowserClient } from "@/lib/supabase-browser";

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
 * localStorage-first / profile-sync-for-signed-in-users pattern as EULAGate.
 */
export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<LanguageCode>("en");
  const [country, setCountry] = useState("US");
  const [showModal, setShowModal] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const storedSet = window.localStorage.getItem(PREFS_SET_KEY);
      if (storedSet) {
        const storedLang = (window.localStorage.getItem(LANG_KEY) as LanguageCode) || "en";
        const storedCountry = window.localStorage.getItem(COUNTRY_KEY) || "US";
        if (!cancelled) {
          setLang(storedLang);
          setCountry(storedCountry);
          setShowModal(false);
        }
        return;
      }

      // Not set on this device yet — a returning signed-in user might already
      // have prefs saved on their profile from another device.
      try {
        const supabase = createSupabaseBrowserClient();
        const { data } = await supabase.auth.getSession();
        if (data.session) {
          const { profile } = await getOwnProfile(apiClient);
          if (profile.language || profile.country) {
            window.localStorage.setItem(PREFS_SET_KEY, "1");
            window.localStorage.setItem(LANG_KEY, profile.language);
            if (profile.country) window.localStorage.setItem(COUNTRY_KEY, profile.country);
            if (!cancelled) {
              setLang(profile.language);
              setCountry(profile.country || "US");
              setShowModal(false);
            }
            return;
          }
        }
      } catch {
        // fall through to first-run detection
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
  }, []);

  function savePrefs(newLang: LanguageCode, newCountry: string) {
    window.localStorage.setItem(PREFS_SET_KEY, "1");
    window.localStorage.setItem(LANG_KEY, newLang);
    window.localStorage.setItem(COUNTRY_KEY, newCountry);
    setLang(newLang);
    setCountry(newCountry);
    setShowModal(false);

    createSupabaseBrowserClient()
      .auth.getSession()
      .then(({ data }) => {
        if (data.session) updateOwnProfile(apiClient, { language: newLang, country: newCountry }).catch(() => {});
      })
      .catch(() => {});
  }

  function dismissModal() {
    window.localStorage.setItem(PREFS_SET_KEY, "1");
    window.localStorage.setItem(LANG_KEY, lang);
    window.localStorage.setItem(COUNTRY_KEY, country);
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
