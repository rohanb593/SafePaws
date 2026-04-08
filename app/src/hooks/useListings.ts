import { Dispatch } from '@reduxjs/toolkit';
import { supabase } from '../lib/supabase';
import { setListings, setListingsLoading, setListingsError } from '../store/listingsSlice';
import { Listing } from '../types/Listing';
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

export const fetchListings = async (
  dispatch: Dispatch,
  filters?: { animal?: string; location?: string; maxPrice?: number }
): Promise<void> => {
  try {
    dispatch(setListingsLoading(true));
    
    let query = supabase
      .from('listings')
      .select('*, user:user_id(*)') //join to user 
      .eq('listing_type', 'minder');
    
    if (filters?.animal) {
      query = query.ilike('animal', `%${filters.animal}%`);
    }
    if (filters?.location) {
      query = query.ilike('location', `%${filters.location}%`);
    }
    if (filters?.maxPrice) {
      query = query.lte('price', filters.maxPrice);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    dispatch(setListings(data || []));
  } catch (err: any) {
    dispatch(setListingsError(err.message));
  } finally {
    dispatch(setListingsLoading(false));
  }
};

//user's listing functions
export const fetchMyListings = async (
  dispatch: Dispatch,
  userId: string
): Promise<Listing[]> => {
  try {
    dispatch(setListingsLoading(true));
    const { data, error } = await supabase
      .from('listings')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    dispatch(setListings(data || []));
    return data || [];
  } catch (err: any) {
    dispatch(setListingsError(err.message));
    return [];
  } finally {
    dispatch(setListingsLoading(false));
  }
};

export const createListing = async (
  dispatch: Dispatch,
  listing: Omit<Listing, 'id' | 'created_at' | 'rating'>
): Promise<Listing | null> => {
  try {
    dispatch(setListingsLoading(true));
    const { data, error } = await supabase
      .from('listings')
      .insert([listing])
      .select()
      .single();
    
    if (error) throw error;
    
    // Refresh listings after create
    await fetchMyListings(dispatch, listing.user_id);
    return data;
  } catch (err: any) {
    dispatch(setListingsError(err.message));
    return null;
  } finally {
    dispatch(setListingsLoading(false));
  }
};

export const updateListing = async (
  dispatch: Dispatch,
  id: string,
  updates: Partial<Listing>
): Promise<void> => {
  try {
    dispatch(setListingsLoading(true));
    const { error } = await supabase
      .from('listings')
      .update(updates)
      .eq('id', id);
    
    if (error) throw error;
  } catch (err: any) {
    dispatch(setListingsError(err.message));
  } finally {
    dispatch(setListingsLoading(false));
  }
};

export const deleteListing = async (
  dispatch: Dispatch,
  id: string
): Promise<void> => {
  try {
    dispatch(setListingsLoading(true));
    const { error } = await supabase
      .from('listings')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  } catch (err: any) {
    dispatch(setListingsError(err.message));
  } finally {
    dispatch(setListingsLoading(false));
  }
};