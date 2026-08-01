/**
 * Stripe-supported currencies mapped to their country codes.
 * Sellers can list in their local currency.
 */
export const CURRENCIES = [
  { code: "USD", symbol: "$",  name: "US Dollar" },
  { code: "CAD", symbol: "CA$", name: "Canadian Dollar" },
  { code: "GBP", symbol: "£",  name: "British Pound" },
  { code: "EUR", symbol: "€",  name: "Euro" },
  { code: "AUD", symbol: "A$", name: "Australian Dollar" },
  { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
  { code: "SGD", symbol: "S$", name: "Singapore Dollar" },
  { code: "HKD", symbol: "HK$", name: "Hong Kong Dollar" },
  { code: "JPY", symbol: "¥",  name: "Japanese Yen" },
  { code: "CNY", symbol: "¥",  name: "Chinese Yuan" },
  { code: "INR", symbol: "₹",  name: "Indian Rupee" },
  { code: "MYR", symbol: "RM", name: "Malaysian Ringgit" },
  { code: "THB", symbol: "฿",  name: "Thai Baht" },
  { code: "BRL", symbol: "R$", name: "Brazilian Real" },
  { code: "MXN", symbol: "MX$", name: "Mexican Peso" },
  { code: "NOK", symbol: "kr", name: "Norwegian Krone" },
  { code: "SEK", symbol: "kr", name: "Swedish Krona" },
  { code: "DKK", symbol: "kr", name: "Danish Krone" },
  { code: "CHF", symbol: "CHF", name: "Swiss Franc" },
  { code: "PLN", symbol: "zł", name: "Polish Zloty" },
  { code: "CZK", symbol: "Kč", name: "Czech Koruna" },
  { code: "RON", symbol: "lei", name: "Romanian Leu" },
  { code: "HUF", symbol: "Ft", name: "Hungarian Forint" },
  { code: "BGN", symbol: "лв", name: "Bulgarian Lev" },
  { code: "AED", symbol: "د.إ", name: "UAE Dirham" },
];

// Suggested default currency for a given country code
export const COUNTRY_DEFAULT_CURRENCY = {
  US: "USD", CA: "CAD", GB: "GBP", AU: "AUD", NZ: "NZD",
  SG: "SGD", HK: "HKD", JP: "JPY", CN: "CNY", IN: "INR",
  MY: "MYR", TH: "THB", BR: "BRL", MX: "MXN", NO: "NOK",
  SE: "SEK", DK: "DKK", CH: "CHF", PL: "PLN", CZ: "CZK",
  RO: "RON", HU: "HUF", BG: "BGN", AE: "AED",
  DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", NL: "EUR",
  BE: "EUR", AT: "EUR", PT: "EUR", FI: "EUR", IE: "EUR",
  GR: "EUR", HR: "EUR", CY: "EUR", LV: "EUR", LT: "EUR",
  LU: "EUR", MT: "EUR", SK: "EUR", SI: "EUR",
};

export function getCurrencySymbol(code) {
  return CURRENCIES.find(c => c.code === code)?.symbol || code;
}

export function formatPrice(amount, currencyCode) {
  const code = (currencyCode || "USD").toUpperCase();
  // Zero-decimal currencies in Stripe
  const zeroDecimal = ["JPY", "KRW", "VND", "IDR", "BIF", "GNF", "MGA", "PYG", "RWF", "UGX", "XAF", "XOF", "XPF"];
  const decimals = zeroDecimal.includes(code) ? 0 : 2;
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency: code,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(amount);
  } catch {
    const sym = getCurrencySymbol(code);
    return `${sym}${amount.toFixed(decimals)}`;
  }
}