import * as Location from 'expo-location'

const EARTH_KM = 6371

/** Great-circle distance in km between two WGS84 points. */
export function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return EARTH_KM * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)))
}

/** Normalise UK-style postcodes for lookup (no spaces, upper case). */
export function normalizeUkPostcode(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null
  const cleaned = raw.replace(/\s+/g, '').toUpperCase()
  if (cleaned.length < 5 || cleaned.length > 8) return null
  return cleaned
}

type LatLng = { lat: number; lng: number }

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T | null> {
  try {
    const res = await fetch(url, init)
    if (!res.ok) return null
    return (await res.json()) as T
  } catch {
    return null
  }
}

/** Single UK postcode → coordinates via postcodes.io (free, no API key). */
export async function geocodeUkPostcode(postcode: string): Promise<LatLng | null> {
  const norm = normalizeUkPostcode(postcode)
  if (!norm) return null
  const json = await fetchJson<{ status: number; result?: { latitude: number; longitude: number } }>(
    `https://api.postcodes.io/postcodes/${encodeURIComponent(norm)}`
  )
  if (json?.status !== 200 || !json.result) return null
  return { lat: json.result.latitude, lng: json.result.longitude }
}

type BulkRow = { query: string; result: { latitude: number; longitude: number } | null }

/** Bulk UK postcodes (up to 100 per request); returns map keyed by normalised postcode. */
export async function bulkGeocodeUkPostcodes(postcodes: (string | null | undefined)[]): Promise<Map<string, LatLng>> {
  const out = new Map<string, LatLng>()
  const unique = [...new Set(postcodes.map((p) => normalizeUkPostcode(p ?? '')).filter(Boolean))] as string[]
  const chunkSize = 100
  for (let i = 0; i < unique.length; i += chunkSize) {
    const chunk = unique.slice(i, i + chunkSize)
    const json = await fetchJson<{ status: number; result?: BulkRow[] }>('https://api.postcodes.io/postcodes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ postcodes: chunk }),
    })
    if (json?.status !== 200 || !json.result) continue
    for (const row of json.result) {
      const key = normalizeUkPostcode(row.query)
      if (!key || !row.result?.latitude || !row.result?.longitude) continue
      out.set(key, { lat: row.result.latitude, lng: row.result.longitude })
    }
  }
  return out
}

/** Fallback when postcodes.io has no match (non-UK or typo): Expo geocoder. */
export async function geocodeAddressFallback(query: string): Promise<LatLng | null> {
  const q = query.trim()
  if (!q) return null
  try {
    const results = await Location.geocodeAsync(q)
    const first = results[0]
    if (first) return { lat: first.latitude, lng: first.longitude }
  } catch {
    /* ignore */
  }
  return null
}

/**
 * Resolve a search centre from the filter postcode (UK API first, then free-text geocode).
 */
export async function resolveSearchCentre(postcode: string): Promise<LatLng | null> {
  const trimmed = postcode.trim()
  if (!trimmed) return null
  const uk = await geocodeUkPostcode(trimmed)
  if (uk) return uk
  return geocodeAddressFallback(`${trimmed}, UK`)
}

