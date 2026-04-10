// Listings hook — wraps Supabase queries implementing ListingsManager logic
// (RQ6, RQ7, RQ33, RQ34, RQ35, RQ36, RQ48, RQ49)
//
// Exports:
//   listings: Listing[]
//   loading: boolean
//   error: string | null
//
//   fetchListings(type?: 'owner_listing' | 'minder_listing'): Promise<void>
//     → supabase.from('listings').select('*').eq('listing_type', type)
//
//   applyFilters(filters: SearchFilters): Promise<void>
//     → chains: .ilike('location', `%${location}%`)   [filterByLocation]
//               .lte('price', maxPrice)                [filterByPrice]
//               .gte('rating', minRating)              [filterByRating]
//               .eq('animal', animalType)              [filterByAnimal]
//
//   createListing(input: NewListingInput): Promise<void>
//     → supabase.from('listings').insert({ ...input, user_id: currentUser.id })
//
//   deleteListing(listingID: string): Promise<void>
//     → supabase.from('listings').delete().eq('id', listingID)
//
// NewListingInput: { profile, location, description, listing_type, animal?, time?, price? }

import { AppDispatch } from '../store'
import { supabase } from '../lib/supabase'
import { Listing } from '../types/Listing'
import { setError, setListings, setLoading } from '../store/listingsSlice'

interface ListingFilters {
  animal?: string
  location?: string
  maxPrice?: number
}

export async function fetchListings(dispatch: AppDispatch, filters?: ListingFilters): Promise<void> {
  dispatch(setLoading(true))
  dispatch(setError(null))

  try {
    let query = supabase
      .from('listings')
      .select('*, user:user_id(*)')
      .eq('listing_type', 'minder_listing')

    if (filters?.animal) {
      query = query.ilike('animal', `%${filters.animal}%`)
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`)
    }
    if (typeof filters?.maxPrice === 'number') {
      query = query.lte('price', filters.maxPrice)
    }

    const { data, error } = await query.order('created_at', { ascending: false })
    if (error) {
      throw error
    }

    dispatch(setListings((data ?? []) as Listing[]))
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch listings'
    dispatch(setError(message))
  } finally {
    dispatch(setLoading(false))
  }
}

export async function fetchMyListings(dispatch: AppDispatch, userId: string): Promise<Listing[]> {
  dispatch(setLoading(true))
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
    dispatch(setListings(listings))
    return listings
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to fetch your listings'
    dispatch(setError(message))
    return []
  } finally {
    dispatch(setLoading(false))
  }
}

export async function createListing(
  dispatch: AppDispatch,
  listing: Omit<Listing, 'id' | 'created_at' | 'rating'>
): Promise<Listing | null> {
  dispatch(setLoading(true))
  dispatch(setError(null))

  try {
    const { data, error } = await supabase.from('listings').insert(listing).select('*').single()
    if (error) {
      throw error
    }
    return data as Listing
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create listing'
    dispatch(setError(message))
    return null
  } finally {
    dispatch(setLoading(false))
  }
}

export async function updateListing(
  dispatch: AppDispatch,
  id: string,
  updates: Partial<Listing>
): Promise<void> {
  dispatch(setLoading(true))
  dispatch(setError(null))

  try {
    const { error } = await supabase.from('listings').update(updates).eq('id', id)
    if (error) {
      throw error
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update listing'
    dispatch(setError(message))
  } finally {
    dispatch(setLoading(false))
  }
}

export async function deleteListing(dispatch: AppDispatch, id: string): Promise<void> {
  dispatch(setLoading(true))
  dispatch(setError(null))

  try {
    const { error } = await supabase.from('listings').delete().eq('id', id)
    if (error) {
      throw error
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete listing'
    dispatch(setError(message))
  } finally {
    dispatch(setLoading(false))
  }
}
