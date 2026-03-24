// Read-only Pet Minder profile (RQ16)
//
// Props: minderID (from navigation params)
// Fetches:
//   supabase.from('profiles').select('*, pet_minder_profiles(*)').eq('id', minderID)
//   supabase.from('reviews').select('*').eq('reviewee_id', minderID)
// Displays: experience, animal_tags, pricing_rate, ratings, certification_titles, Review list
//
// Elements:
//   Avatar, Rating, Badge list (animal_tags), Review cards
//   Button ('Request Booking' → BookingRequestScreen)
//   Button ('Save to Favourites' → upsert into favourites table, RQ48)
//   Button ('Message' → ChatScreen)
