// Only countries where Stripe Connect is available and the app is supported
export const COUNTRIES = [
  { code: "AU", name: "Australia" },
  { code: "AT", name: "Austria" },
  { code: "BE", name: "Belgium" },
  { code: "BR", name: "Brazil" },
  { code: "BG", name: "Bulgaria" },
  { code: "CA", name: "Canada" },
  { code: "HR", name: "Croatia" },
  { code: "CY", name: "Cyprus" },
  { code: "CZ", name: "Czech Republic" },
  { code: "DK", name: "Denmark" },
  { code: "EE", name: "Estonia" },
  { code: "FI", name: "Finland" },
  { code: "FR", name: "France" },
  { code: "DE", name: "Germany" },
  { code: "GI", name: "Gibraltar" },
  { code: "GR", name: "Greece" },
  { code: "HK", name: "Hong Kong" },
  { code: "HU", name: "Hungary" },
  { code: "IN", name: "India" },
  { code: "IE", name: "Ireland" },
  { code: "IT", name: "Italy" },
  { code: "JP", name: "Japan" },
  { code: "LV", name: "Latvia" },
  { code: "LI", name: "Liechtenstein" },
  { code: "LT", name: "Lithuania" },
  { code: "LU", name: "Luxembourg" },
  { code: "MY", name: "Malaysia" },
  { code: "MT", name: "Malta" },
  { code: "MX", name: "Mexico" },
  { code: "NL", name: "Netherlands" },
  { code: "NZ", name: "New Zealand" },
  { code: "NO", name: "Norway" },
  { code: "PL", name: "Poland" },
  { code: "PT", name: "Portugal" },
  { code: "RO", name: "Romania" },
  { code: "SG", name: "Singapore" },
  { code: "SK", name: "Slovakia" },
  { code: "SI", name: "Slovenia" },
  { code: "ES", name: "Spain" },
  { code: "SE", name: "Sweden" },
  { code: "CH", name: "Switzerland" },
  { code: "TH", name: "Thailand" },
  { code: "AE", name: "United Arab Emirates" },
  { code: "GB", name: "United Kingdom" },
  { code: "US", name: "United States" },
];

export function getCountryName(code) {
  return COUNTRIES.find(c => c.code === code)?.name || code;
}

// Detect country from browser locale/timezone
export function detectCountry() {
  try {
    // Try timezone-based detection first (most reliable)
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
    const tzMap = {
      "America/New_York": "US", "America/Chicago": "US", "America/Denver": "US",
      "America/Los_Angeles": "US", "America/Phoenix": "US", "America/Anchorage": "US",
      "Pacific/Honolulu": "US", "America/Indiana/Indianapolis": "US",
      "America/Toronto": "CA", "America/Vancouver": "CA", "America/Montreal": "CA",
      "America/Winnipeg": "CA", "America/Halifax": "CA",
      "Europe/London": "GB", "Europe/Paris": "FR", "Europe/Berlin": "DE",
      "Europe/Amsterdam": "NL", "Europe/Brussels": "BE", "Europe/Madrid": "ES",
      "Europe/Rome": "IT", "Europe/Zurich": "CH", "Europe/Vienna": "AT",
      "Europe/Stockholm": "SE", "Europe/Oslo": "NO", "Europe/Copenhagen": "DK",
      "Europe/Helsinki": "FI", "Europe/Lisbon": "PT", "Europe/Warsaw": "PL",
      "Europe/Prague": "CZ", "Europe/Budapest": "HU", "Europe/Bucharest": "RO",
      "Europe/Athens": "GR", "Europe/Zagreb": "HR", "Europe/Ljubljana": "SI",
      "Europe/Bratislava": "SK", "Europe/Riga": "LV", "Europe/Vilnius": "LT",
      "Europe/Tallinn": "EE", "Europe/Dublin": "IE", "Europe/Nicosia": "CY",
      "Europe/Luxembourg": "LU", "Europe/Valletta": "MT",
      "Asia/Tokyo": "JP", "Asia/Singapore": "SG", "Asia/Hong_Kong": "HK",
      "Asia/Kuala_Lumpur": "MY", "Asia/Bangkok": "TH", "Asia/Kolkata": "IN",
      "Asia/Dubai": "AE",
      "Australia/Sydney": "AU", "Australia/Melbourne": "AU", "Australia/Brisbane": "AU",
      "Australia/Perth": "AU", "Australia/Adelaide": "AU",
      "Pacific/Auckland": "NZ",
      "America/Sao_Paulo": "BR", "America/Mexico_City": "MX",
    };
    if (tz && tzMap[tz]) {
      const code = tzMap[tz];
      if (COUNTRIES.find(c => c.code === code)) return code;
    }

    // Fallback: browser locale language tag (e.g. "en-US", "fr-FR")
    const locale = navigator.language || navigator.languages?.[0] || "";
    const localeCountry = locale.split("-")[1]?.toUpperCase();
    if (localeCountry && COUNTRIES.find(c => c.code === localeCountry)) {
      return localeCountry;
    }
  } catch (_) {}
  return "US"; // default
}

// Detect language from browser
export function detectLanguage() {
  try {
    const locale = navigator.language || navigator.languages?.[0] || "en";
    const lang = locale.split("-")[0].toLowerCase();
    // Only return if it's one we support
    const supported = ["en", "es", "fr", "de", "pt", "it", "ja", "zh"];
    return supported.includes(lang) ? lang : "en";
  } catch (_) {
    return "en";
  }
}