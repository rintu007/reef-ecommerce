import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Waves } from "lucide-react";
import { LANGUAGES, useT } from "@/lib/i18n";
import { COUNTRIES, detectCountry, detectLanguage } from "@/lib/countries";
import { useUserPrefs } from "@/lib/UserPrefsContext";

export default function UserPrefsModal() {
  const { savePrefs, showPrefsModal, setShowPrefsModal } = useUserPrefs();

  const [lang, setLang] = useState(() => detectLanguage());
  const [countryCode, setCountryCode] = useState(() => detectCountry());
  const [detected, setDetected] = useState(false);

  const t = useT(lang);

  useEffect(() => {
    if (!showPrefsModal) return;
    const detectedCountry = detectCountry();
    const detectedLang = detectLanguage();
    setCountryCode(detectedCountry);
    setLang(detectedLang);
    setDetected(detectedCountry !== "US" || navigator.language?.startsWith("en") === false);
  }, [showPrefsModal]);

  if (!showPrefsModal) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
      <div className="bg-card rounded-2xl w-full max-w-sm shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-br from-primary to-blue-700 px-6 pt-8 pb-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/20 flex items-center justify-center mx-auto mb-3">
            <Waves className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">{t("prefs_title")}</h2>
          <p className="text-white/80 text-sm mt-1">{t("prefs_subtitle")}</p>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Language */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">{t("choose_language")}</label>
            <div className="grid grid-cols-2 gap-2">
              {LANGUAGES.map((l) => (
                <button
                  key={l.code}
                  onClick={() => setLang(l.code)}
                  className={`py-2.5 px-3 rounded-xl border text-sm font-medium transition-colors text-left ${
                    lang === l.code
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-foreground hover:bg-muted"
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-semibold text-foreground">{t("choose_country")}</label>
              {detected && (
                <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-medium">
                  📍 Auto-detected
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground">{t("prefs_country_note")}</p>
            <select
              value={countryCode}
              onChange={(e) => setCountryCode(e.target.value)}
              className="w-full h-11 rounded-xl border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>{c.name}</option>
              ))}
            </select>
            <p className="text-[11px] text-muted-foreground">
              Only countries supported by Stripe payments are listed.
            </p>
          </div>

          <Button
            className="w-full h-12 rounded-xl font-bold"
            onClick={() => savePrefs(lang, countryCode)}
          >
            {t("get_started")}
          </Button>

          <button
            onClick={() => setShowPrefsModal(false)}
            className="w-full text-center text-xs text-muted-foreground hover:underline"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}