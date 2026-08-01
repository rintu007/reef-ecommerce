/**
 * geocodeLocation
 * Converts a "City, State" string to lat/lng using the free Nominatim API.
 * Body: { location: string }
 * Returns: { lat, lng } or { error }
 */
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.23';

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

  const { location } = await req.json();
  if (!location) return Response.json({ error: 'Missing location' }, { status: 400 });

  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(location)}&format=json&limit=1`;
  const res = await fetch(url, {
    headers: { 'User-Agent': 'ReefMarket/1.0' }
  });
  const data = await res.json();

  if (!data || data.length === 0) {
    return Response.json({ error: 'Location not found' }, { status: 404 });
  }

  return Response.json({ lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) });
});