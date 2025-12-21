// utils/geocoding.ts

type GeocodeResult = { lat: number; lng: number } | null;

export async function geocodeAddress(address: string): Promise<GeocodeResult> {
  const key = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY;

  if (!key) throw new Error("EXPO_PUBLIC_GOOGLE_MAPS_API_KEY manquante dans .env");

  const query = encodeURIComponent(address.trim());
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${query}&key=${key}`;

  const res = await fetch(url);
  const json = await res.json();

  if (json.status !== "OK" || !json.results?.length) return null;

  const loc = json.results[0].geometry.location;
  return { lat: loc.lat, lng: loc.lng };
}
