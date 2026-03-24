// Browse listings from both roles (RQ33, RQ34, RQ35, RQ36)
//
// Uses: useListings → fetchListings()
// State: activeTab ('owner_listing' | 'minder_listing')
// Fetches: supabase.from('listings').select('*').eq('listing_type', activeTab)
//
// Elements:
//   Tab switcher (Owner Listings | Minder Listings)
//   FlatList of ListingCard
//   Button ('Post New Listing' → createListing(), RQ35)
