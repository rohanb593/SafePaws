// Listings hook — wraps Supabase queries implementing ListingsManager logic
// (RQ6, RQ7, RQ33, RQ34, RQ35, RQ36, RQ48, RQ49)
//
// Exports:
//   listings: Listing[]
//   loading: boolean
//   error: string | null
//
//   fetchListings(filters?: SearchFilters): Promise<void>
//
//   applyFilters(filters: SearchFilters): Promise<void>
//     → chains: .ilike('location', `%${location}%`)   [filterByLocation]
//               .lte('price', maxPrice)                [filterByPrice]
//               .gte('rating', minRating)              [filterByRating]
//               .eq('animal', animalType)              [filterByAnimal]
//
//   createListing(input): Promise<{ listing, errorMessage }>
//     → supabase.from('listings').insert({ ...input, user_id: currentUser.id })
//
//   deleteListing(listingID: string): Promise<{ errorMessage }>
//     → supabase.from('listings').delete().eq('id', listingID)
//
// NewListingInput: { profile, location, description, animal?, time?, price? }

import { AppDispatch } from '../store'
import type { SearchFilters } from '../store/listingsSlice'
import { supabase } from '../lib/supabase'
import { filterListingsByAvailability } from '../types/availability'
import { Listing } from '../types/Listing'
import {
  bulkGeocodeUkPostcodes,
  geocodeAddressFallback,
  geocodeUkPostcode,
  haversineKm,
  normalizeUkPostcode,
  resolveSearchCentre,
} from '../utils/geocodePostcode'
import {
  setError,
  setListings,
  setLoading,
  setMyListings,
  setMyListingsLoading,
} from '../store/listingsSlice'

/** Embedded FK row can be object, single-element array, or missing — normalize to `user` for UI. */
function pickEmbeddedProfile(row: Record<string, unknown>): unknown {
  const direct = row.user
  const emb = row.profiles
  if (Array.isArray(emb) && emb.length) return emb[0]
  if (emb && typeof emb === 'object') return emb
  return direct ?? null
}

/** Joined profile comes back as `user` (alias) or `profiles` depending on select hint — normalize for UI. */
function attachProfileUser<T extends Record<string, unknown>>(rows: T[]): (T & { user?: unknown })[] {
  return rows.map((row) => ({ ...row, user: pickEmbeddedProfile(row) }))
}

async function sortListingsByPostcodeDistance(rows: Listing[], filterPostcode: string): Promise<Listing[]> {
  const center = await resolveSearchCentre(filterPostcode)
  if (!center) return rows

  const bulkMap = await bulkGeocodeUkPostcodes(rows.map((r) => r.postcode))
  const enriched: Listing[] = []

  for (const row of rows) {
    const key = normalizeUkPostcode(row.postcode ?? '')
    let lat: number | undefined
    let lng: number | undefined

    if (key && bulkMap.has(key)) {
      const c = bulkMap.get(key)!
      lat = c.lat
      lng = c.lng
    } else if (row.postcode?.trim()) {
      const one = await geocodeUkPostcode(row.postcode)
      if (one) {
        lat = one.lat
        lng = one.lng
      }
    }
    if (lat == null || lng == null) {
      const line = [row.postcode, row.location].filter(Boolean).join(', ')
      const fb = line
        ? await geocodeAddressFallback(line && !/\buk\b/i.test(line) ? `${line}, UK` : line)
        : null
      if (fb) {
        lat = fb.lat
        lng = fb.lng
      }
    }

    const distanceKm =
      lat != null && lng != null ? haversineKm(center.lat, center.lng, lat, lng) : undefined
    enriched.push({ ...row, distanceKm })
  }

  enriched.sort((a, b) => {
    const da = a.distanceKm ?? Number.POSITIVE_INFINITY
    const db = b.distanceKm ?? Number.POSITIVE_INFINITY
    return da - db
  })
  return enriched
}

export async function fetchListings(dispatch: AppDispatch, filters?: SearchFilters): Promise<void> {
  dispatch(setLoading(true))
  dispatch(setError(null))

  try {
    // Single FK listings.user_id → profiles: embed as `profiles` then map to `user` for UI.
    let query = supabase.from('listings').select('*, profiles!listings_user_id_fkey(*)')

    if (filters?.animal) {
      query = query.ilike('animal', `%${filters.animal}%`)
    }
    if (filters?.postcode?.trim()) {
      query = query.ilike('postcode', `%${filters.postcode.trim()}%`)
    }
    if (typeof filters?.maxPrice === 'number') {
      // Include rows with no price set (null), not only lte — plain lte() drops nulls in SQL.
      query = query.or(`price.is.null,price.lte.${filters.maxPrice}`)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      throw error
    }

    let rows = attachProfileUser((data ?? []) as Record<string, unknown>[]) as unknown as Listing[]
    rows = filterListingsByAvailability(rows, {
      day: filters?.day,
      timeFrom: filters?.timeFrom,
      timeTo: filters?.timeTo,
    })
    if (filters?.postcode?.trim()) {
      rows = await sortListingsByPostcodeDistance(rows, filters.postcode.trim())
    } else {
      rows = rows.map((r) => {
        const { distanceKm: _, ...rest } = r
        return rest as Listing
      })
    }
    dispatch(setListings(rows))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch listings'
    dispatch(setError(message))
  } finally {
    dispatch(setLoading(false))
  }
}

export async function fetchMyListings(dispatch: AppDispatch, userId: string): Promise<Listing[]> {
  dispatch(setMyListingsLoading(true))
  dispatch(setError(null))

  try {
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw error
    }

    const listings = (data ?? []) as Listing[]
    dispatch(setMyListings(listings))
    return listings
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch your listings'
    dispatch(setError(message))
    return []
  } finally {
    dispatch(setMyListingsLoading(false))
  }
}

/** Columns on `public.listings` — only these are sent on insert to avoid stray client fields. */
function toListingsInsertRow(
  listing: Omit<Listing, 'id' | 'created_at'> & { distanceKm?: number }
) {
  const { distanceKm: _d, ...rest } = listing
  const row: Record<string, unknown> = {
    user_id: rest.user_id,
    location: rest.location,
    postcode: rest.postcode ?? '',
    description: rest.description ?? '',
    animal: rest.animal,
    availability: rest.availability ?? null,
    time: rest.time ?? null,
    price: rest.price ?? null,
    rating: rest.rating ?? null,
  }
  if (rest.listing_type != null) {
    row.listing_type = rest.listing_type
  }
  return row
}

export async function createListing(
  dispatch: AppDispatch,
  listing: Omit<Listing, 'id' | 'created_at'>
): Promise<{ listing: Listing | null; errorMessage: string | null }> {
  dispatch(setMyListingsLoading(true))
  dispatch(setError(null))

  try {
    const row = toListingsInsertRow(listing)
    const { data, error } = await supabase.from('listings').insert(row).select('*')
    if (error) {
      throw error
    }
    const inserted = Array.isArray(data) && data.length > 0 ? (data[0] as Listing) : null
    const refreshed = await fetchMyListings(dispatch, listing.user_id)
    const listingOut = inserted ?? refreshed[0] ?? null
    return { listing: listingOut, errorMessage: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create listing'
    dispatch(setError(message))
    return { listing: null, errorMessage: message }
  } finally {
    dispatch(setMyListingsLoading(false))
  }
}

export async function updateListing(
  dispatch: AppDispatch,
  id: string,
  updates: Partial<Listing>
): Promise<{ errorMessage: string | null }> {
  dispatch(setMyListingsLoading(true))
  dispatch(setError(null))

  try {
    const { distanceKm: _clientDistance, ...rest } = updates as Partial<Listing> & { distanceKm?: number }
    const { error } = await supabase.from('listings').update(rest).eq('id', id)
    if (error) {
      throw error
    }
    return { errorMessage: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update listing'
    dispatch(setError(message))
    return { errorMessage: message }
  } finally {
    dispatch(setMyListingsLoading(false))
  }
}

export async function deleteListing(dispatch: AppDispatch, id: string): Promise<{ errorMessage: string | null }> {
  dispatch(setMyListingsLoading(true))
  dispatch(setError(null))

  try {
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) {
      throw error
    }
    return { errorMessage: null }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete listing'
    dispatch(setError(message))
    return { errorMessage: message }
  } finally {
    dispatch(setMyListingsLoading(false))
  }
}
