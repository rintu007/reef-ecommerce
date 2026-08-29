"use client";

import { useState } from "react";
import { COUNTRIES, LANGUAGES, useT, type LanguageCode } from "@reef-market/shared";
import { useLanguagePrefs } from "@/lib/language-context";

/** Legacy parity: legacy/vite-app/src/components/UserPrefsModal.jsx. */
export function UserPrefsModal() {
  const { lang: detectedLang, country: detectedCountry, showModal, savePrefs, dismissModal } = useLanguagePrefs();
  const [lang, setLang] = useState<LanguageCode>(detectedLang);
  const [country, setCountry] = useState(detectedCountry);
  const t = useT(lang);

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 px-6 pt-8 pb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3 text-2xl">🪸</div>
          <h2 className="text-xl font-bold text-white">{t("prefs_title")}</h2>
          <p className="text-white/80 text-sm mt-1">{t("prefs_subtitle")}</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">{t("choose_language")}</label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium text-left ${
                    lang === l.code ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-gray-900">{t("choose_country")}</label>
            <p className="text-xs text-gray-500">{t("prefs_country_note")}</p>
            <select
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              className="w-full h-11 rounded-xl border border-gray-300 bg-white px-3 text-sm"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="w-full h-12 rounded-xl font-bold bg-blue-600 hover:bg-blue-700 text-white text-sm"
            onClick={() => savePrefs(lang, country)}
          >
            {t("get_started")}
          </button>

          <button onClick={dismissModal} className="w-full text-center text-xs text-gray-400 hover:underline">
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
