// Incoming booking requests list (RQ10, RQ33)
//
// Fetches: supabase.from('bookings')
//   .select('*, pets(*), profiles!owner_id(*)')
//   .eq('minder_id', uid)
//   .eq('status', 'pending')
//
// Elements:
//   FlatList of BookingCard → JobDetailsScreen on press
