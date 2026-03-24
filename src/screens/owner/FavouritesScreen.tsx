// Saved Pet Minders list (RQ48)
//
// Fetches: supabase.from('favourites').select('*, profiles!minder_id(*)').eq('owner_id', uid)
//
// Elements:
//   FlatList of MinderCard
//   Button ('View Profile' → MinderProfileScreen)
//   Button ('Remove' → supabase.from('favourites').delete().eq('minder_id', id))
