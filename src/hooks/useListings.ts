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
