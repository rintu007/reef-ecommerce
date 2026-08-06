/**
 * Server-side geocoding for local-pickup listings' `location` free-text field,
 * so Browse's ZIP/GPS radius search can filter by real lat/lng (see
 * `nearby_listing_ids` SQL fn) instead of legacy's per-listing runtime geocode
 * hack. Nominatim (OpenStreetMap) requires a descriptive User-Agent per its
 * usage policy — no API key needed.
 */
export async function geocodeLocation(location: string): Promise<{ lat: number; lng: number } | null> {
  if (!location?.trim()) return null;
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "ReefMarket/1.0 (https://reefmarket.app)" } });
    if (!res.ok) return null;
    const data = (await res.json()) as { lat: string; lon: string }[];
    const first = data[0];
    if (!first) return null;
    return { lat: parseFloat(first.lat), lng: parseFloat(first.lon) };
  } catch {
    return null;
  }
}
